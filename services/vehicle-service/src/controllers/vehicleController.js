const Vehicle = require('../models/vehicleModel');

const createVehicle = async (req, res) => {
  try {
    // Handle uploaded files
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];

    const vehicleData = {
      ...req.body,
      car_providerId: req.user.userId,
      status: 'Pending',
      images: imagePaths
    };

    // Validate required fields
    const requiredFields = [
      'name', 'brand', 'modelYear', 'licensePlate',
      'rentalPricePerDay', 'seats', 'transmission', 'fuelType'
    ];

    const missingFields = requiredFields.filter(field => !vehicleData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'License plate already exists'
      });
    }
    res.status(500).json({
      message: 'Error creating vehicle',
      error: error.message
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    // Check if the user is the owner of the vehicle
    if (vehicle.car_providerId.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to delete this vehicle'
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting vehicle',
      error: error.message
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle uploaded files if any
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];
    
    const updateData = {
      ...req.body,
      ...(imagePaths.length > 0 && { images: imagePaths })
    };

    // Find vehicle and check ownership
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    // Check if the user is the owner of the vehicle
    if (vehicle.car_providerId.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to update this vehicle'
      });
    }

    // Prevent updating certain fields
    delete updateData.car_providerId; // Cannot change ownership
    delete updateData.status; // Status changes should be handled separately

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Vehicle updated successfully',
      data: updatedVehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'License plate already exists'
      });
    }
    res.status(500).json({
      message: 'Error updating vehicle',
      error: error.message
    });
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const {
      brand,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      seats,
      status,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (transmission) filter.transmission = transmission;
    if (fuelType) filter.fuelType = fuelType;
    if (seats) filter.seats = seats;
    if (status) filter.status = status;
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.rentalPricePerDay = {};
      if (minPrice) filter.rentalPricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.rentalPricePerDay.$lte = Number(maxPrice);
    }

    // Calculate skip value for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query with filters, sorting, and pagination
    const vehicles = await Vehicle.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving vehicles',
      error: error.message
    });
  }
};

module.exports = {
  createVehicle,
  deleteVehicle,
  updateVehicle,
  getAllVehicles
}; 