const express = require('express');
const router = express.Router();
const { createVehicle } = require('../controllers/vehicleController');
const { verifyToken, requireCarProvider } = require('../middleware/authMiddleware');
const { validateCreateVehicle } = require('../middleware/vehicleValidation');
const upload = require('../config/multerConfig');

// Create a new vehicle - requires car_provider role
router.post('/create', 
  verifyToken, 
  requireCarProvider,
  upload.array('images', 10), // Handle multiple image uploads, max 10
  validateCreateVehicle,
  createVehicle
);

module.exports = router; 