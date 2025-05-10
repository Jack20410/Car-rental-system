const Rating = require('../models/Rating');
const { logRatingActivity } = require('../utils/activityLogger');

// POST / - Submit new rating
exports.createRating = async (req, res) => {
  try {
    const { vehicleId, userId, rating, comment, userName } = req.body;
    const newRating = await Rating.create({ vehicleId, userId, rating, comment, userName });

    // Log rating creation activity
    await logRatingActivity(
      userId,
      'customer',
      'ADD_RATING',
      {
        ratingId: newRating._id,
        vehicleId: newRating.vehicleId,
        rating: newRating.rating,
        hasComment: !!newRating.comment
      }
    );

    res.status(201).json(newRating);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /:carId - Get all ratings for a car
exports.getRatingsByCar = async (req, res) => {
  try {
    const ratings = await Rating.find({ vehicleId: req.params.carId }).sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /:carId/average - Get average rating for a car
exports.getAverageRating = async (req, res) => {
  try {
    const result = await Rating.aggregate([
      { $match: { vehicleId: req.params.carId } },
      { $group: { _id: '$vehicleId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (result.length === 0) {
      return res.json({ average: null, count: 0 });
    }
    res.json({ average: result[0].average, count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /:id - Delete a rating
exports.deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Rating not found' });

    await Rating.findByIdAndDelete(req.params.id);

    // Log rating deletion activity
    await logRatingActivity(
      rating.userId,
      'customer',
      'DELETE_RATING',
      {
        ratingId: rating._id,
        vehicleId: rating.vehicleId,
        deletedAt: new Date()
      }
    );

    res.json({ message: 'Rating deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /by-provider/:providerId - Get all ratings for all cars of a provider
exports.getRatingsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    // You need to get all vehicleIds for this provider
    // Option 1: If you have a Vehicle model and DB access here:
    // const vehicles = await Vehicle.find({ car_providerId: providerId });
    // const vehicleIds = vehicles.map(v => v._id.toString());

    // Option 2: If you get vehicleIds from frontend (recommended for microservices):
    // Accept ?vehicleIds=1,2,3 as query param
    const vehicleIds = req.query.vehicleIds ? req.query.vehicleIds.split(',') : [];
    if (!vehicleIds.length) return res.json([]);

    const ratings = await Rating.find({ vehicleId: { $in: vehicleIds } }).sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /user/:userId - Get all ratings submitted by a user
exports.getRatingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ userId }).sort({ createdAt: -1 });
    
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};