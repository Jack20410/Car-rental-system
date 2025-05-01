const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

ratingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
ratingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Rating', ratingSchema);