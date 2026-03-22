const IVehicleRepository = require('../interfaces/IVehicleRepository');
const Vehicle = require('../models/vehicleModel');

/**
 * MongoVehicleRepository
 * Concrete implementation of IVehicleRepository backed by Mongoose.
 * This class is the ONLY place in vehicle-service where Mongoose Vehicle model is called.
 */
class MongoVehicleRepository extends IVehicleRepository {
  async create(vehicleData) {
    const vehicle = new Vehicle(vehicleData);
    return vehicle.save();
  }

  async findById(id) {
    return Vehicle.findById(id);
  }

  async findByLicensePlate(licensePlate, excludeId = null) {
    const filter = { licensePlate };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return Vehicle.findOne(filter);
  }

  async findWithPagination(queryParams) {
    const {
      brand, transmission, fuelType, minPrice, maxPrice,
      seats, status, car_providerId, city,
      sortBy = 'createdAt', order = 'desc',
      page = 1, limit = 10,
    } = queryParams;

    // Build filter object — all query-building logic lives HERE, not in the controller
    const filter = {};
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (transmission) filter.transmission = transmission;
    if (fuelType) filter.fuelType = fuelType;
    if (seats) filter.seats = seats;
    if (status) filter.status = status;
    if (car_providerId) filter.car_providerId = car_providerId;
    if (city) {
      const normalizedCity = city.replace(/[\s-]+/g, '').toLowerCase();
      filter['location.city'] = {
        $regex: normalizedCity.split('').join('\\s*'),
        $options: 'i',
      };
    }
    if (minPrice || maxPrice) {
      filter.rentalPricePerDay = {};
      if (minPrice) filter.rentalPricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.rentalPricePerDay.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };

    const vehicles = await Vehicle.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Vehicle.countDocuments(filter);

    return {
      vehicles,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    };
  }

  async updateById(id, updates, options = { new: true, runValidators: true }) {
    return Vehicle.findByIdAndUpdate(id, updates, options);
  }

  async updateStatus(id, status) {
    return Vehicle.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return Vehicle.findByIdAndDelete(id);
  }

  async removeImage(id, imagePath) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return null;
    vehicle.images = vehicle.images.filter(img => img !== imagePath);
    return vehicle.save();
  }
}

module.exports = MongoVehicleRepository;
