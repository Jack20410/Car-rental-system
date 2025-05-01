const Rating = require('../models/Rating');

// POST / - Submit new rating
exports.createRating = async (req, res) => {
  try {
    const { vehicleId, userId, rating, comment } = req.body;
    const newRating = await Rating.create({ vehicleId, userId, rating, comment });
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
    const deleted = await Rating.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Rating not found' });
    res.json({ message: 'Rating deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};