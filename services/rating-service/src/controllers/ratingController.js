const Rating = require('../models/Rating');
const { logRatingActivity } = require('../utils/activityLogger');

// POST / - Submit new rating
exports.createRating = async (req, res) => {
  try {
    const { vehicleId, userId, rentalId, rating, comment, userName } = req.body;

    // Kiểm tra xem đã có rating cho rental này chưa
    const existingRating = await Rating.findOne({ rentalId });
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this rental' });
    }

    const newRating = await Rating.create({ 
      vehicleId, 
      userId, 
      rentalId,
      rating, 
      comment, 
      userName 
    });

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
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ error: 'You have already rated this rental' });
    }
    res.status(400).json({ error: err.message });
  }
};

// PUT /:id - Update a rating
exports.updateRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ratingId = req.params.id;

    const existingRating = await Rating.findById(ratingId);
    if (!existingRating) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    // Kiểm tra xem người dùng có quyền sửa rating này không
    if (existingRating.userId !== req.body.userId) {
      return res.status(403).json({ error: 'Not authorized to update this rating' });
    }

    // Kiểm tra số lần update
    if (existingRating.updateCount >= 1) {
      return res.status(400).json({ error: 'You can only update your rating once' });
    }

    const updatedRating = await Rating.findByIdAndUpdate(
      ratingId,
      { 
        rating, 
        comment,
        updateCount: existingRating.updateCount + 1,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Log rating update activity
    await logRatingActivity(
      existingRating.userId,
      'customer',
      'UPDATE_RATING',
      {
        ratingId: existingRating._id,
        vehicleId: existingRating.vehicleId,
        oldRating: existingRating.rating,
        newRating: rating
      }
    );

    res.json(updatedRating);
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

    // Kiểm tra xem người dùng có quyền xóa rating này không
    if (rating.userId !== req.body.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this rating' });
    }

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

// GET /by-rental/:rentalId - Get rating for a specific rental
exports.getRatingByRental = async (req, res) => {
  try {
    const rating = await Rating.findOne({ rentalId: req.params.rentalId });
    if (!rating) {
      return res.json(null);
    }
    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};