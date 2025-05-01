const express = require('express');
const router = express.Router();
const { 
  createVehicle, 
  deleteVehicle, 
  updateVehicle, 
  updateVehicleStatus, 
  getAllVehicles, 
  getVehicleById,
  addReview,           // <-- thêm dòng này
  getReviews           // <-- thêm dòng này
} = require('../controllers/vehicleController');
const { verifyToken, requireCarProvider } = require('../middleware/authMiddleware');
const { validateCreateVehicle } = require('../middleware/vehicleValidation');
const upload = require('../config/multerConfig');
const Vehicle = require('../models/vehicleModel');
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
router.delete('/vehicles/:id/images', verifyToken, requireCarProvider, async (req, res) => {
  try {
    const { imagePath } = req.body;
    const vehicleId = req.params.id;
    
    // Get the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if image exists in vehicle's images
    if (!vehicle.images.includes(imagePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Remove image from vehicle's images array
    vehicle.images = vehicle.images.filter(img => img !== imagePath);
    await vehicle.save();

    // Delete physical file
    const fullPath = path.join(__dirname, '../../../uploads/vehicles', path.basename(imagePath));
    
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        // Don't fail the request if file deletion fails
      }
    });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

router.post('/vehicles/:id/reviews', addReview);

// Get all reviews for a vehicle (public)
router.get('/vehicles/:id/reviews', getReviews);

module.exports = router;