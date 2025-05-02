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
const { 
  verifyToken, 
  requireCustomer,
  requireCarProvider,
  requireRole 
} = require('../middleware/authMiddleware');
const { validateCreateRental } = require('../middleware/rentalValidation');

// Public routes
// GET - Check rental availability
router.get('/availability', checkAvailability);

// Customer routes
// POST - Create a new rental (customer only)
router.post(
  '/',
  verifyToken,
  requireCustomer,
  validateCreateRental,
  createRental
);

// GET - Get all rentals for the authenticated user
// Need to change for only role admin
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

// Update rental status - Combined route for all status updates
router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin', 'customer', 'car_provider']),
  updateRentalStatus
);

// Payment status updates
router.patch(
  '/:id/payment',
  verifyToken,
  requireRole(['admin', 'system']),
  updatePaymentStatus
);

module.exports = router; 