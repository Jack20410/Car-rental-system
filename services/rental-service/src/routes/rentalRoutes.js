const express = require('express');
const router = express.Router();
const { 
  createRental, 
  getUserRentals, 
  getRentalById, 
  updateRentalStatus, 
  updatePaymentStatus,
  checkAvailability,
  getAllRentals,
  getProviderRentals
} = require('../controllers/rentalController');
const { 
  verifyToken, 
  requireRole
} = require('../middleware/authMiddleware');
const { validateCreateRental } = require('../middleware/rentalValidation');

// Public routes
router.get('/all', getAllRentals);

// GET - Check rental availability
router.get('/availability', checkAvailability);

// Customer routes
// POST - Create a new rental (customer only)
router.post(
  '/',
  verifyToken,
  requireRole(['customer', 'car_provider']),
  validateCreateRental,
  createRental
);

// GET - Get all rentals for the authenticated user
// Need to change for only role admin
router.get(
  '/',
  verifyToken,
  requireRole(['customer', 'car_provider']),
  getUserRentals
);

// GET - Get all rentals for the authenticated car provider
router.get(
  '/provider',
  verifyToken,
  requireRole('car_provider'),
  getProviderRentals
);

// GET - Get a specific rental by ID
router.get(
  '/:id',
  verifyToken,
  getRentalById
);

// Update rental status - Combined route for all status updates
router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin', 'customer', 'car_provider']),
  updateRentalStatus
);

// Payment status updates
// Hien tai chi co the cap nhat thu cong
router.patch(
  '/:id/payment',
  verifyToken,
  requireRole(['admin', 'customer', 'car_provider']),
  updatePaymentStatus
);

module.exports = router; 