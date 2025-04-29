const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Rental'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Paypal', 'Bank Transfer', 'Cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionTime: {
    type: Date
  },
  providerPaymentId: {
    type: String
  },
  paymentDetails: {
    type: Object
  }
}, { timestamps: true }); // createdAt, updatedAt tự động

module.exports = mongoose.model('Payment', paymentSchema);
