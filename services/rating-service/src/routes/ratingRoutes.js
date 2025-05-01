const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// POST / - Submit new rating
router.post('/', ratingController.createRating);

// GET /:carId - Get all ratings for a car
router.get('/:carId', ratingController.getRatingsByCar);

// GET /:carId/average - Get average rating for a car
router.get('/:carId/average', ratingController.getAverageRating);

// DELETE /:id - Delete a rating
router.delete('/:id', ratingController.deleteRating);

module.exports = router;