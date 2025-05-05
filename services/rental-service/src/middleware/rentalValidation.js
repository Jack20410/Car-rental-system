const { body, validationResult } = require('express-validator');
const { RENTAL_TYPES, HOURLY_RENTAL_OPTIONS } = require('../constants/rentalConstants');

// Validate rental creation request
exports.validateCreateRental = [
  body('vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .isMongoId().withMessage('Invalid vehicle ID format'),
  
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date format'),
  
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date format'),
  
  body('rentalType')
    .notEmpty().withMessage('Rental type is required')
    .isIn(Object.values(RENTAL_TYPES)).withMessage('Invalid rental type. Must be either hourly or daily'),
  
  body('hourlyDuration')
    .if(body('rentalType').equals(RENTAL_TYPES.HOURLY))
    .notEmpty().withMessage('Hourly duration is required for hourly rentals')
    .isIn(Object.values(HOURLY_RENTAL_OPTIONS).map(option => option.duration)).withMessage(`Invalid hourly duration. Must be one of: ${Object.values(HOURLY_RENTAL_OPTIONS).map(option => option.duration).join(', ')} hours`),
  
  // Validation middleware handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

const validateCreateRental = (req, res, next) => {
  const { vehicleId, startDate, endDate, rentalType, hourlyDuration } = req.body;

  // Common validations
  if (!vehicleId || !startDate || !rentalType) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle ID, start date, and rental type are required'
    });
  }

  if (!Object.values(RENTAL_TYPES).includes(rentalType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rental type. Must be either hourly or daily'
    });
  }

  // Type-specific validations
  if (rentalType === RENTAL_TYPES.HOURLY) {
    if (!hourlyDuration) {
      return res.status(400).json({
        success: false,
        message: 'Hourly duration is required for hourly rentals'
      });
    }

    const validDurations = Object.values(HOURLY_RENTAL_OPTIONS).map(option => option.duration);
    if (!validDurations.includes(hourlyDuration)) {
      return res.status(400).json({
        success: false,
        message: `Invalid hourly duration. Must be one of: ${validDurations.join(', ')} hours`
      });
    }

    if (endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date should not be provided for hourly rentals as it will be calculated automatically'
      });
    }
  } else { // Daily rental
    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required for daily rentals'
      });
    }

    if (hourlyDuration) {
      return res.status(400).json({
        success: false,
        message: 'Hourly duration should not be provided for daily rentals'
      });
    }
  }

  next();
};

module.exports = {
  validateCreateRental
}; 