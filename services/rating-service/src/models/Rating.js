const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  userId: { type: String, required: true },
  rentalId: { type: String, required: true, unique: true },
  userName: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  updateCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ratingSchema.index({ rentalId: 1 }, { unique: true });

ratingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
ratingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Rating', ratingSchema);