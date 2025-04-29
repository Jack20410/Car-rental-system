const express = require('express');
const router = express.Router();
const { createVehicle, 
        deleteVehicle, 
        updateVehicle, 
        updateVehicleStatus, 
        getAllVehicles, 
        searchAvailableVehicles,
        getVehicleById } = require('../controllers/vehicleController');
const { verifyToken, requireCarProvider } = require('../middleware/authMiddleware');
const { validateCreateVehicle } = require('../middleware/vehicleValidation');
const upload = require('../config/multerConfig');

// Get all vehicles - public route
router.get('/vehicles', getAllVehicles);

// Search available vehicles with filters - public route
router.get('/vehicles/search', searchAvailableVehicles);

// Get vehicle by ID - public route
router.get('/vehicles/:id', getVehicleById);

// Create a new vehicle - requires car_provider role
router.post('/vehicles', 
  verifyToken, 
  requireCarProvider,
  upload.array('images', 10),
  validateCreateVehicle,
  createVehicle
);

// Update vehicle - requires car_provider role
router.patch('/vehicles/:id', 
  verifyToken, 
  requireCarProvider, 
  upload.array('images', 10),
  updateVehicle
);

// Update vehicle status - requires car_provider role
router.patch('/vehicles/:id/status', 
  verifyToken, 
  requireCarProvider, 
  updateVehicleStatus
);

// Delete vehicle - requires car_provider role
router.delete('/vehicles/:id', verifyToken, requireCarProvider, deleteVehicle);

module.exports = router; 