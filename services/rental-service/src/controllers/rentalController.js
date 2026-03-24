/**
 * Rental Controller — Refactored (Phase 1: Clean Architecture)
 *
 * All database access goes through IRentalRepository (via DI).
 * All cross-service calls go through IVehicleServiceClient (via DI).
 * All activity logging goes through IActivityLogger (via DI).
 *
 * This controller ONLY handles HTTP request/response concerns.
 */
const { RENTAL_TYPES, HOURLY_RENTAL_OPTIONS } = require('../constants/rentalConstants');
const { ValidationError, NotFoundError, ForbiddenError } = require('../errors/AppError');

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
      throw new ValidationError('Invalid hourly duration');
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
const checkAvailability = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const { vehicleId, startDate, endDate } = req.query;
    
    if (!vehicleId || !startDate || !endDate) {
      throw new ValidationError('Vehicle ID, start date, and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlappingRentals = await rentalRepo.findOverlappingRentals(vehicleId, start, end);
    const isAvailable = overlappingRentals.length === 0;

    return res.status(200).json({
      success: true,
      data: {
        isAvailable,
        conflictingRentals: isAvailable ? [] : overlappingRentals
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new rental
const createRental = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const vehicleService = req.container.resolve('vehicleServiceClient');
    const activityLogger = req.container.resolve('activityLogger');

    const { vehicleId, startDate, endDate, rentalType, hourlyDuration } = req.body;
    const userId = req.user.userId;

    const start = new Date(startDate);
    let end;
    let totalPrice;

    // Get vehicle details from vehicle service
    const vehicle = await vehicleService.getVehicle(vehicleId, req.headers.authorization);

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Check if vehicle is available
    if (vehicle.status !== 'Available') {
      throw new ValidationError('This vehicle is not available for rent');
    }

    // Handle rental based on type
    if (rentalType === RENTAL_TYPES.HOURLY) {
      end = calculateHourlyEndDate(start, hourlyDuration);
      totalPrice = calculateHourlyRentalPrice(hourlyDuration, vehicle);
    } else {
      end = new Date(endDate);
      totalPrice = calculateDailyRentalPrice(start, end, vehicle);
    }

    // Get car_providerId from vehicle data
    const car_providerId = vehicle.car_providerId;

    if (!car_providerId) {
      throw new ValidationError('Vehicle provider information is missing');
    }

    // Create rental record
    const rental = await rentalRepo.create({
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

    // Log rental creation activity
    await activityLogger.logRentalActivity(
      userId,
      req.user.role,
      'CREATE_RENTAL_ORDER',
      {
        rentalId: rental._id,
        vehicleId: rental.vehicleId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalPrice: rental.totalPrice,
        rentalType: rental.rentalType
      }
    );

    // Mark vehicle as unavailable
    await vehicleService.updateVehicleStatus(vehicleId, 'Rented', req.headers.authorization);

    return res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: rental
    });
  } catch (error) {
    next(error);
  }
};

// Get all rentals for a user
const getUserRentals = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const userId = req.user.userId;
    const { status, paymentStatus } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const rentals = await rentalRepo.findWithPagination(filter, { createdAt: -1 }, 0, 0);
    
    return res.status(200).json({
      success: true,
      message: 'Rentals retrieved successfully',
      data: rentals
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific rental by ID
const getRentalById = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const rental = await rentalRepo.findById(id);
    
    if (!rental) {
      throw new NotFoundError('Rental');
    }
    
    // Check if the user is the owner of the rental or an admin
    if (rental.userId.toString() !== userId && userRole !== 'admin') {
      throw new ForbiddenError('Not authorized to view this rental');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rental retrieved successfully',
      data: rental
    });
  } catch (error) {
    next(error);
  }
};

// Update rental status (cancel, approve, reject, complete)
const updateRentalStatus = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const vehicleService = req.container.resolve('vehicleServiceClient');
    const activityLogger = req.container.resolve('activityLogger');

    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    // Validate status
    const validStatuses = ['pending', 'cancelled', 'rejected', 'approved', 'started', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const rental = await rentalRepo.findById(id);
    
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    // Define allowed transitions based on user role and conditions
    const allowedTransitions = {
      customer: {
        pending: ['cancelled'],
        approved: ['started']
      },
      car_provider: {
        pending: ['cancelled', 'approved', 'rejected'],
        approved: ['started'],
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
      throw new ForbiddenError(`You are not authorized to change status from ${rental.status} to ${status}`);
    }

    // Additional validation for customer and car_provider roles
    if (userRole === 'customer' || userRole === 'car_provider') {
      if (rental.userId.toString() !== userId && 
          (userRole === 'customer' || rental.car_providerId.toString() !== userId)) {
        throw new ForbiddenError(
          userRole === 'customer' 
            ? 'You can only update your own rentals'
            : 'You can only update rentals that you created or rentals for your vehicles'
        );
      }
    }

    // Check payment status when transitioning from approved to started
    if (rental.status === 'approved' && status === 'started' && rental.paymentStatus !== 'paid') {
      throw new ValidationError('Cannot start rental until payment is completed');
    }

    // Only update if status is actually changing
    if (rental.status !== status) {
      rental.status = status;
      await rental.save();
      
      // Log rental status update activity
      await activityLogger.logRentalActivity(
        req.user.userId,
        req.user.role,
        'UPDATE_RENTAL_ORDER',
        {
          rentalId: rental._id,
          vehicleId: rental.vehicleId,
          oldStatus: rental.status,
          newStatus: status,
          updatedAt: new Date()
        }
      );
      
      // Update vehicle status based on rental status
      if (['cancelled', 'completed', 'rejected'].includes(status)) {
        await vehicleService.updateVehicleStatus(
          rental.vehicleId, 'Available', req.headers.authorization
        );
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rental status updated successfully',
      data: rental
    });
  } catch (error) {
    next(error);
  }
};

// Update payment status
const updatePaymentStatus = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');
    const activityLogger = req.container.resolve('activityLogger');

    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user.userId;
    
    // Validate payment status
    if (paymentStatus !== 'paid') {
      throw new ValidationError('Invalid payment status. Only "paid" status is allowed.');
    }
    
    const rental = await rentalRepo.findById(id);
    
    if (!rental) {
      throw new NotFoundError('Rental');
    }
    
    // Check if the user is the owner of the rental
    if (rental.userId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to update this rental');
    }

    // Check if rental is in a valid status for payment
    const validRentalStatuses = ['approved', 'started', 'completed'];
    if (!validRentalStatuses.includes(rental.status)) {
      throw new ValidationError('Cannot update payment status. Rental must be approved, started, or completed.');
    }

    // Check current payment status
    if (rental.paymentStatus !== 'unpaid') {
      throw new ValidationError('Payment status can only be updated from unpaid to paid');
    }
    
    // Update payment status only — let the pre-save middleware handle the history
    rental.paymentStatus = 'paid';
    await rental.save();

    // Log payment status update activity
    await activityLogger.logRentalActivity(
      userId,
      req.user.role,
      'UPDATE_RENTAL_ORDER',
      {
        rentalId: rental._id,
        vehicleId: rental.vehicleId,
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: rental
    });
  } catch (error) {
    next(error);
  }
};

// Get all rentals (public function)
const getAllRentals = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');

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
    
    const total = await rentalRepo.count(filter);
    const rentals = await rentalRepo.findWithPagination(filter, { createdAt: -1 }, skip, limit);
    
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
    next(error);
  }
};

// Get rentals for a car provider
const getProviderRentals = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');

    const car_providerId = req.user.userId;
    const { status, paymentStatus } = req.query;

    // Verify user is a car provider
    if (req.user.role !== 'car_provider') {
      throw new ForbiddenError('Access denied. Only car providers can access their rentals.');
    }

    // Build filter object
    const filter = { car_providerId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await rentalRepo.count(filter);
    const rentals = await rentalRepo.findWithPagination(filter, { createdAt: -1 }, skip, limit);

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
    next(error);
  }
};

// Get all present/active rentals
const getPresentRentals = async (req, res, next) => {
  try {
    const rentalRepo = req.container.resolve('rentalRepository');

    const rentals = await rentalRepo.findWithPagination({}, { createdAt: -1 }, 0, 0);
    const total = await rentalRepo.count({});
    
    return res.status(200).json({
      success: true,
      message: 'All rentals retrieved successfully',
      data: rentals,
      total
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAvailability,
  createRental,
  getUserRentals,
  getRentalById,
  updateRentalStatus,
  updatePaymentStatus,
  getAllRentals,
  getProviderRentals,
  getPresentRentals,
};
