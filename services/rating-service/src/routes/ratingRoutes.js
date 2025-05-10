const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// POST / - Submit new rating
router.post('/', ratingController.createRating);

// GET /user/:userId - Get all ratings submitted by a user
router.get('/user/:userId', ratingController.getRatingsByUser);

// GET /by-provider/:providerId - Get all ratings for a provider
router.get('/by-provider/:providerId', ratingController.getRatingsByProvider);

// GET /:carId/average - Get average rating for a car
router.get('/:carId/average', ratingController.getAverageRating);

// GET /:carId - Get all ratings for a car
router.get('/:carId', ratingController.getRatingsByCar);

// DELETE /:id - Delete a rating
router.delete('/:id', ratingController.deleteRating);

module.exports = router;