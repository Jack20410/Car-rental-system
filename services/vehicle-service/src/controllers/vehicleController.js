const Vehicle = require('../models/vehicleModel');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Helper function to fetch user details
const fetchUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching user details for ID ${userId}:`, error.message);
    return null;
  }
};

// Helper function to attach user details to vehicle
const attachUserDetails = async (vehicle) => {
  if (!vehicle.car_providerId) return vehicle;
  
  const userDetails = await fetchUserDetails(vehicle.car_providerId);
  if (userDetails) {
    return {
      ...vehicle.toObject(),
      car_providerId: userDetails
    };
  }
  return vehicle;
};

const createVehicle = async (req, res) => {
  try {
    // Handle uploaded files
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];

    const vehicleData = {
      ...req.body,
      car_providerId: req.user.userId,
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

    // Check if licensePlate exists on another vehicle
    if (req.body.licensePlate) {
      const existing = await Vehicle.findOne({
        licensePlate: req.body.licensePlate,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({
          message: 'License plate already exists'
        });
      }
    }

    // Handle uploaded files if any
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];
    
    // Handle existing images reordering
    let finalImages = [];
    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      finalImages = [...existingImages];
    }
    
    // Add any new images to the end of the array
    if (imagePaths.length > 0) {
      finalImages = [...finalImages, ...imagePaths];
    }

    const updateData = {
      ...req.body,
      ...(finalImages.length > 0 && { images: finalImages })
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
    delete updateData.existingImages; // Remove the existingImages field from the update data

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

const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
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

    // Validate status against model's enum
    const validStatuses = vehicle.schema.path('status').enumValues;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update only the status field
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Vehicle status updated successfully',
      data: updatedVehicle
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating vehicle status',
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
      car_providerId,
      city,
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
    if (car_providerId) filter.car_providerId = car_providerId;
    if (city) {
      const normalizedCity = city.replace(/[\s-]+/g, '').toLowerCase();
      filter['location.city'] = {
        $regex: normalizedCity.split('').join('\\s*'),
        $options: 'i'
      };
    }
    
    if (minPrice || maxPrice) {
      filter.rentalPricePerDay = {};
      if (minPrice) filter.rentalPricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.rentalPricePerDay.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Get vehicles
    const vehicles = await Vehicle.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Attach user details to each vehicle
    const vehiclesWithUserDetails = await Promise.all(
      vehicles.map(vehicle => attachUserDetails(vehicle))
    );

    // Get total count for pagination
    const total = await Vehicle.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles: vehiclesWithUserDetails,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving vehicles:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving vehicles',
      error: error.message
    });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      });
    }

    // Attach user details
    const vehicleWithUserDetails = await attachUserDetails(vehicle);

    res.status(200).json({
      message: 'Vehicle retrieved successfully',
      data: vehicleWithUserDetails
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid vehicle ID format'
      });
    }
    res.status(500).json({
      message: 'Error retrieving vehicle',
      error: error.message
    });
  }
};

module.exports = {
  createVehicle,
  deleteVehicle,
  updateVehicle,
  updateVehicleStatus,
  getAllVehicles,
  getVehicleById
};