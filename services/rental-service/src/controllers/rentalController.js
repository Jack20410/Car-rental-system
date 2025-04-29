const Rental = require('../models/rentalModel');
const axios = require('axios');

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

    // Calculate number of days
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
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

    // Calculate total price
    const totalPrice = days * vehicle.rentalPricePerDay;

    // Create rental record
    const rental = new Rental({
      userId,
      vehicleId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid'
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
      // Continue with the rental creation even if the status update fails
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

// Update rental status (cancel, complete)
exports.updateRentalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    
    // Validate status
    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
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
    
    // Check if the user is the owner of the rental
    if (rental.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }
    
    // Update rental status
    rental.status = status;
    await rental.save();
    
    // If rental is cancelled or completed, update vehicle status
    if (status === 'cancelled' || status === 'completed') {
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
    
    // Update payment status
    rental.paymentStatus = paymentStatus;
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

// Check rental availability for a date range
exports.checkAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Convert dates to start of day and end of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);  // Set to start of day

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);  // Set to end of day

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Find rentals that overlap with the given date range
    const overlappingRentals = await Rental.find({
      $and: [
        { status: { $nin: ['cancelled'] } },
        {
          $or: [
            // Rental starts during the requested period
            {
              startDate: { $gte: start, $lt: end }
            },
            // Rental ends during the requested period
            {
              endDate: { $gt: start, $lte: end }
            },
            // Rental spans the entire requested period
            {
              startDate: { $lte: start },
              endDate: { $gte: end }
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Rental availability checked successfully',
      data: overlappingRentals
    });
  } catch (error) {
    console.error('Error checking rental availability:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking rental availability',
      error: error.message
    });
  }
}; 