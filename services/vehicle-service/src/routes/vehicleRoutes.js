const express = require('express');
const router = express.Router();
const { createVehicle, deleteVehicle, updateVehicle, getAllVehicles } = require('../controllers/vehicleController');
const { verifyToken, requireCarProvider } = require('../middleware/authMiddleware');
const { validateCreateVehicle } = require('../middleware/vehicleValidation');
const upload = require('../config/multerConfig');

// Create a new vehicle - requires car_provider role
router.post('/create', verifyToken, requireCarProvider,
upload.array('images', 10),
validateCreateVehicle,
createVehicle
);

router.delete('/delete/:id', verifyToken, requireCarProvider, deleteVehicle);

router.patch('/update/:id', 
  verifyToken, 
  requireCarProvider, 
  upload.array('images', 10),
  updateVehicle
);

router.get('/vehicles', getAllVehicles);

module.exports = router; 