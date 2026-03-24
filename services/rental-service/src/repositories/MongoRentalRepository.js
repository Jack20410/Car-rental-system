const IRentalRepository = require('../interfaces/IRentalRepository');
const Rental = require('../models/rentalModel');

/**
 * MongoRentalRepository
 * Concrete implementation of IRentalRepository backed by Mongoose.
 * This class is the ONLY place in rental-service where Mongoose Rental model is called.
 */
class MongoRentalRepository extends IRentalRepository {
  async create(rentalData) {
    const rental = new Rental(rentalData);
    return rental.save();
  }

  async findById(id) {
    return Rental.findById(id);
  }

  async findOverlappingRentals(vehicleId, startDate, endDate) {
    return Rental.find({
      vehicleId,
      status: { $nin: ['cancelled', 'rejected'] },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });
  }

  async updateById(id, updates) {
    return Rental.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  async findWithPagination(filters, sortOptions, skip, limit) {
    return Rental.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
  }

  async count(filters) {
    return Rental.countDocuments(filters);
  }
}

module.exports = MongoRentalRepository;
