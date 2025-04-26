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

module.exports = {
  createVehicle
}; 