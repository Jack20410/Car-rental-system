const express = require('express');
const router = express.Router();
const { 
  createRental, 
  getUserRentals, 
  getRentalById, 
  updateRentalStatus, 
  updatePaymentStatus,
  checkAvailability 
} = require('../controllers/rentalController');
const { verifyToken, requireCustomer } = require('../middleware/authMiddleware');
const { validateCreateRental } = require('../middleware/rentalValidation');

// GET - Check rental availability
router.get('/availability', checkAvailability);

// POST - Create a new rental (customer only)
router.post(
  '/',
  verifyToken,
  requireCustomer,
  validateCreateRental,
  createRental
);

// GET - Get all rentals for the authenticated user
router.get(
  '/',
  verifyToken,
  requireCustomer,
  getUserRentals
);

// GET - Get a specific rental by ID
router.get(
  '/:id',
  verifyToken,
  requireCustomer,
  getRentalById
);

// PATCH - Update rental status (cancel, complete)
router.patch(
  '/:id/status',
  verifyToken,
  requireCustomer,
  updateRentalStatus
);

// PATCH - Update payment status
router.patch(
  '/:id/payment',
  verifyToken,
  requireCustomer,
  updatePaymentStatus
);

module.exports = router; 