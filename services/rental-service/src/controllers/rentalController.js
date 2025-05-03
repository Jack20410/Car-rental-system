const Rental = require('../models/rentalModel');
const axios = require('axios');
const { RENTAL_TYPES, HOURLY_RENTAL_OPTIONS } = require('../constants/rentalConstants');

// Helper function to calculate rental price for daily rentals
const calculateDailyRentalPrice = (start, end, vehicle) => {
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return days * vehicle.rentalPricePerDay;
};

// Helper function to calculate rental price for hourly rentals
const calculateHourlyRentalPrice = (hourlyDuration, vehicle) => {
  let priceMultiplier;
  switch (hourlyDuration) {
    case 6:
      priceMultiplier = HOURLY_RENTAL_OPTIONS.SIX_HOURS.priceMultiplier;
      break;
    case 8:
      priceMultiplier = HOURLY_RENTAL_OPTIONS.EIGHT_HOURS.priceMultiplier;
      break;
    case 12:
      priceMultiplier = HOURLY_RENTAL_OPTIONS.TWELVE_HOURS.priceMultiplier;
      break;
    default:
      throw new Error('Invalid hourly duration');
  }
  return vehicle.rentalPricePerDay * priceMultiplier;
};

// Helper function to calculate end date for hourly rentals
const calculateHourlyEndDate = (startDate, hourlyDuration) => {
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + hourlyDuration);
  return endDate;
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
  try {
    const { vehicleId, startDate, endDate, rentalType, hourlyDuration } = req.body;
    const userId = req.user.userId;

    // Convert start date to Date object
    const start = new Date(startDate);
    let end;
    let totalPrice;

    // Get vehicle details from vehicle service
    let vehicleResponse;
    try {
      const vehicleUrl = `${process.env.VEHICLE_SERVICE_URL}/vehicles/${vehicleId}`;
      vehicleResponse = await axios.get(
        vehicleUrl,
        { 
          headers: { 
            Authorization: req.headers.authorization 
          }
        }
      );
    } catch (error) {
      console.error('Vehicle service error:', error);
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

    // Handle rental based on type
    if (rentalType === RENTAL_TYPES.HOURLY) {
      // Calculate end date based on hourly duration
      end = calculateHourlyEndDate(start, hourlyDuration);
      
      // Calculate price for hourly rental
      totalPrice = calculateHourlyRentalPrice(hourlyDuration, vehicle);
    } else {
      end = new Date(endDate);
      // Calculate price for daily rental
      totalPrice = calculateDailyRentalPrice(start, end, vehicle);
    }

    // Get car_providerId from vehicle data
    const car_providerId = vehicle.car_providerId;

    if (!car_providerId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle provider information is missing'
      });
    }

    // Create rental record
    const rental = new Rental({
      userId,
      vehicleId,
      car_providerId,
      rentalType,
      hourlyDuration: rentalType === RENTAL_TYPES.HOURLY ? hourlyDuration : undefined,
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
        pending: ['cancelled', 'approved', 'rejected'], // car_provider can do what customer can
        approved: ['started'],                         // and more
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

    // Additional validation for customer and car_provider roles
    if (userRole === 'customer' || userRole === 'car_provider') {
      // For customer: can only update their own rentals
      // For car_provider: can update their own rentals OR rentals of their vehicles
      if (rental.userId.toString() !== userId && 
          (userRole === 'customer' || rental.car_providerId.toString() !== userId)) {
        return res.status(403).json({
          success: false,
          message: userRole === 'customer' 
            ? 'You can only update your own rentals'
            : 'You can only update rentals that you created or rentals for your vehicles'
        });
      }
    }

    // Check payment status when transitioning from approved to started
    if (rental.status === 'approved' && status === 'started' && rental.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start rental until payment is completed'
      });
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
    if (paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Only "paid" status is allowed.'
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

    // Check if rental is in a valid status for payment
    const validRentalStatuses = ['approved', 'started', 'completed'];
    if (!validRentalStatuses.includes(rental.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update payment status. Rental must be approved, started, or completed.'
      });
    }

    // Check current payment status
    if (rental.paymentStatus !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Payment status can only be updated from unpaid to paid'
      });
    }
    
    // Update payment status only - let the pre-save middleware handle the history
    rental.paymentStatus = 'paid';

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

