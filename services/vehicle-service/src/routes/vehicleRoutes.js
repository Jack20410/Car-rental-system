const express = require('express');
const router = express.Router();
const { createVehicle, 
        deleteVehicle, 
        updateVehicle, 
        updateVehicleStatus, 
        getAllVehicles, 
        getVehicleById } = require('../controllers/vehicleController');
const { verifyToken, requireCarProvider } = require('../middleware/authMiddleware');
const { validateCreateVehicle } = require('../middleware/vehicleValidation');
const upload = require('../config/multerConfig');
const { NotFoundError } = require('../errors/AppError');
const fs = require('fs');
const path = require('path');

// Get all vehicles - public route
router.get('/vehicles', getAllVehicles);

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

// Delete vehicle image - requires car_provider role
router.delete('/vehicles/:id/images', verifyToken, requireCarProvider, async (req, res, next) => {
  try {
    const vehicleRepository = req.container.resolve('vehicleRepository');
    const { imagePath } = req.body;
    const vehicleId = req.params.id;
    
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (!vehicle.images.includes(imagePath)) throw new NotFoundError('Image');

    await vehicleRepository.removeImage(vehicleId, imagePath);

    // Delete physical file
    const fullPath = path.join(__dirname, '../../../uploads/vehicles', path.basename(imagePath));
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;