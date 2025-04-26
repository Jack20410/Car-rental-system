const { body, validationResult } = require('express-validator');

const validateCreateVehicle = [
  // Basic vehicle information
  body('name')
    .trim()
    .notEmpty().withMessage('Vehicle name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required')
    .isLength({ min: 2, max: 50 }).withMessage('Brand must be between 2 and 50 characters'),
  
  body('modelYear')
    .notEmpty().withMessage('Model year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid model year'),
  
  body('licensePlate')
    .trim()
    .notEmpty().withMessage('License plate is required')
    .matches(/^[A-Z0-9- ]{2,20}$/).withMessage('Invalid license plate format'),
  
  body('rentalPricePerDay')
    .notEmpty().withMessage('Rental price is required')
    .isFloat({ min: 0 }).withMessage('Rental price must be a positive number'),
  
  body('seats')
    .notEmpty().withMessage('Number of seats is required')
    .isInt({ min: 1, max: 50 }).withMessage('Invalid number of seats'),
  body('carType')
    .notEmpty().withMessage('Car type is required')
    .isIn(['Sedan', 'SUV', 'Convertible', 'Coupe', 'Hatchback', 'Other']).withMessage('Invalid car type'),
  
  body('transmission')
    .trim()
    .notEmpty().withMessage('Transmission type is required')
    .isIn(['Manual', 'Automatic']).withMessage('Invalid transmission type'),
  
  body('fuelType')
    .trim()
    .notEmpty().withMessage('Fuel type is required')
    .isIn(['Gasoline', 'Diesel', 'Electric', 'Hybrid']).withMessage('Invalid fuel type'),
  
  // Optional fields with validation
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array')
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }
      if (value) {
        value.forEach(imagePath => {
          if (typeof imagePath !== 'string') {
            throw new Error('Image path must be a string');
          }
          if (imagePath.length < 1 || imagePath.length > 500) {
            throw new Error('Image path length must be between 1 and 500 characters');
          }
        });
      }
      return true;
    }),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),
  
  body('location.coordinates.coordinates')
    .optional()
    .isArray().withMessage('Coordinates must be an array')
    .custom((value) => {
      if (value && value.length !== 2) {
        throw new Error('Coordinates must contain exactly 2 values [longitude, latitude]');
      }
      if (value) {
        const [longitude, latitude] = value;
        if (longitude < -180 || longitude > 180) {
          throw new Error('Invalid longitude value');
        }
        if (latitude < -90 || latitude > 90) {
          throw new Error('Invalid latitude value');
        }
      }
      return true;
    }),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateCreateVehicle
}; 