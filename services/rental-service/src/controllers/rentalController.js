const Rental = require('../models/rentalModel');
const axios = require('axios');

// Helper function to calculate rental price
const calculateRentalPrice = (start, end, vehicle) => {
  // Check if rental is within the same day
  const isSameDay = start.toDateString() === end.toDateString();
  
  if (isSameDay) {
    // Calculate hours for same-day rental
    const hourDiff = (end - start) / (1000 * 60 * 60);
    
    // If rental is under 6 hours, charge 50% of daily rate
    if (hourDiff = 6) {
      return vehicle.rentalPricePerDay * 0.75;
    }
    // If rental is 6-12 hours, charge 75% of daily rate
    else if (hourDiff = 12) {
      return vehicle.rentalPricePerDay ;
    }
    // If over 12 hours, charge full day rate
    else if (hourDiff = 20) {
      return vehicle.rentalPricePerDay *1.25;
    }
  } else {
    // Calculate number of days (rounded up)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days * vehicle.rentalPricePerDay;
  }
};

// Check vehicle availability for specified dates
exports.checkAvailability = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, start date, and end date are required'
      });
    }

    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find any overlapping rentals for the vehicle that are not cancelled or rejected
    const overlappingRentals = await Rental.find({
      vehicleId,
      status: { $nin: ['cancelled', 'rejected'] },
      $or: [
        // Rental period overlaps with start date
        { 
          startDate: { $lte: start },
          endDate: { $gte: start }
        },
        // Rental period overlaps with end date
        {
          startDate: { $lte: end },
          endDate: { $gte: end }
        },
        // Rental period is inside requested period
        {
          startDate: { $gte: start },
          endDate: { $lte: end }
        }
      ]
    });

    const isAvailable = overlappingRentals.length === 0;

    return res.status(200).json({
      success: true,
      data: {
        isAvailable,
        conflictingRentals: isAvailable ? [] : overlappingRentals
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking availability'
    });
  }
};

// Create a new rental
exports.createRental = async (req, res) => {
  console.log('Received rental creation request:', {
    body: req.body,
    user: req.user,
    headers: req.headers
  });
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user.userId;

    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date must be after start date' 
      });
    }

    if (start < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date cannot be in the past' 
      });
    }

    // Validate minimum rental duration (2 hours)
    const minHours = 2;
    const hourDiff = (end - start) / (1000 * 60 * 60);
    if (hourDiff < minHours) {
      return res.status(400).json({
        success: false,
        message: `Minimum rental duration is ${minHours} hours`
      });
    }
    
    // Get vehicle details from vehicle service
    let vehicleResponse;
    try {
      const vehicleUrl = `${process.env.VEHICLE_SERVICE_URL}/vehicles/${vehicleId}`;
      console.log('Attempting to fetch vehicle:', {
        url: vehicleUrl,
        headers: {
          Authorization: req.headers.authorization
        }
      });
      vehicleResponse = await axios.get(
        vehicleUrl,
        { 
          headers: { 
            Authorization: req.headers.authorization 
          }
        }
      );
      console.log('Vehicle service response:', vehicleResponse.data);
    } catch (error) {
      console.error('Vehicle service error:', {
        message: error.message,
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or service unavailable'
      });
    }

    const vehicle = vehicleResponse.data.data;
    
    // Check if vehicle is available
    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is not available for rent'
      });
    }

    // Calculate total price using the new helper function
    const totalPrice = calculateRentalPrice(start, end, vehicle);

    // Get car_providerId from vehicle data
    const car_providerId = vehicle.car_providerId;

    if (!car_providerId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle provider information is missing'
      });
    }

    // Create rental record with initial status history and car_providerId
    const rental = new Rental({
      userId,
      vehicleId,
      car_providerId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid',
      statusHistory: [{ status: 'pending', changedAt: new Date() }],
      paymentHistory: [{ status: 'unpaid', changedAt: new Date() }]
    });

    await rental.save();

    // Mark vehicle as unavailable
    try {
      await axios.patch(
        `${process.env.VEHICLE_SERVICE_URL}/vehicles/${vehicleId}/status`,
        { status: 'Rented' },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (error) {
      console.error('Could not update vehicle status:', error.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: rental
    });
  } catch (error) {
    console.error('Error creating rental:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the rental'
    });
  }
};

// Get all rentals for a user
exports.getUserRentals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, paymentStatus } = req.query;
    
    // Build filter object
    const filter = { userId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const rentals = await Rental.find(filter).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      message: 'Rentals retrieved successfully',
      data: rentals
    });
  } catch (error) {
    console.error('Error retrieving rentals:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving rentals'
    });
  }
};

// Get a specific rental by ID
exports.getRentalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if the user is the owner of the rental
    if (rental.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this rental'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rental retrieved successfully',
      data: rental
    });
  } catch (error) {
    console.error('Error retrieving rental:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the rental'
    });
  }
};

// Update rental status (cancel, approve, reject, complete)
exports.updateRentalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    // Validate status
    const validStatuses = ['pending', 'cancelled', 'rejected', 'approved', 'started', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Define allowed transitions based on user role and conditions
    const allowedTransitions = {
      customer: {
        pending: ['cancelled'],
        approved: ['started']
      },
      car_provider: {
        pending: ['approved', 'rejected'],
        started: ['completed']
      },
      admin: {
        pending: ['cancelled', 'approved', 'rejected'],
        approved: ['started'],
        started: ['completed'],
        cancelled: [],
        rejected: [],
        completed: []
      }
    };

    // Get allowed next statuses for current user role and rental status
    const allowedNextStatuses = allowedTransitions[userRole]?.[rental.status] || [];

    // Check if the status transition is allowed for this user role
    if (!allowedNextStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to change status from ${rental.status} to ${status}`
      });
    }

    // Additional validation for customer role
    if (userRole === 'customer') {
      // Verify if the user is the owner of the rental
      if (rental.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own rentals'
        });
      }
    }

    // Additional validation for car_provider role
    if (userRole === 'car_provider') {
      // Verify if the user is the provider of the rental
      if (rental.car_providerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update rentals for your vehicles'
        });
      }
    }

    // Only update if status is actually changing
    if (rental.status !== status) {
      rental.status = status;
      // statusHistory will be automatically updated by the pre-save middleware
      
      await rental.save();
      
      // Update vehicle status based on rental status
      if (['cancelled', 'completed', 'rejected'].includes(status)) {
        try {
          await axios.patch(
            `${process.env.VEHICLE_SERVICE_URL}/vehicles/${rental.vehicleId}/status`,
            { status: 'Available' },
            { headers: { Authorization: req.headers.authorization } }
          );
        } catch (error) {
          console.error('Could not update vehicle status:', error.message);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rental status updated successfully',
      data: rental
    });
  } catch (error) {
    console.error('Error updating rental status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the rental status'
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user.userId;
    
    // Validate payment status
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if the user is the owner of the rental
    if (rental.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }

    // Validate payment status transition
    const validTransitions = {
      'unpaid': ['paid'],
      'paid': ['refunded'],
      'refunded': []
    };

    if (!validTransitions[rental.paymentStatus].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${rental.paymentStatus} to ${paymentStatus}`
      });
    }
    
    // Update payment status and add to history
    rental.paymentStatus = paymentStatus;
    rental.paymentHistory.push({
      status: paymentStatus,
      changedAt: new Date()
    });

    await rental.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: rental
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the payment status'
    });
  }
};

// Get all rentals
exports.getAllRentals = async (req, res) => {
  try {
    const { status, paymentStatus, limit = 10, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rentals = await Rental.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Rental.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      message: 'Rentals retrieved successfully',
      data: rentals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error retrieving all rentals:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving rentals'
    });
  }
};

// Get all rentals for a provider
exports.getProviderRentals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, paymentStatus, limit = 10, page = 1 } = req.query;
    
    // Build filter object
    const filter = { car_providerId: userId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rentals = await Rental.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Rental.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      message: 'Provider rentals retrieved successfully',
      data: rentals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error retrieving provider rentals:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving provider rentals'
    });
  }
};

// Get all rentals (public function)
exports.getAllRentals = async (req, res) => {
  try {
    // Apply filters if provided in query params
    const filter = {};
    const { status, paymentStatus, userId, vehicleId } = req.query;
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (userId) filter.userId = userId;
    if (vehicleId) filter.vehicleId = vehicleId;
    
    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Rental.countDocuments(filter);
    
    // Get rentals with pagination and sorting
    const rentals = await Rental.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      message: 'All rentals retrieved successfully',
      data: {
        rentals,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving all rentals:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving rentals'
    });
  }
};

// Get rentals for a car provider
exports.getProviderRentals = async (req, res) => {
  try {
    const car_providerId = req.user.userId; // Get provider's ID from authenticated user
    const { status, paymentStatus } = req.query;
    
    console.log('Fetching rentals for provider:', {
      car_providerId,
      userRole: req.user.role,
      status,
      paymentStatus
    });

    // Verify user is a car provider
    if (req.user.role !== 'car_provider') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only car providers can access their rentals.'
      });
    }

    // Build filter object
    const filter = { car_providerId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    console.log('Applying filter:', filter);

    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Rental.countDocuments(filter);

    // Get rentals without population first
    const rentals = await Rental.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${rentals.length} rentals for provider`);

    return res.status(200).json({
      success: true,
      message: 'Provider rentals retrieved successfully',
      data: {
        rentals,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving provider rentals:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving provider rentals',
      error: error.message
    });
  }
}; 

