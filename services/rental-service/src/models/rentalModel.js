const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vehicle'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'cancelled', 'approved', 'rejected', 'active', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'cancelled', 'approved', 'rejected', 'active', 'completed']
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentHistory: [{
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded']
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Pre-save middleware to track status changes
rentalSchema.pre('save', function(next) {
  // If this is a new document, add initial status to histories
  if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      changedAt: new Date()
    }];
    this.paymentHistory = [{
      status: this.paymentStatus,
      changedAt: new Date()
    }];
  } else {
    // If status has changed, add to history
    if (this.isModified('status')) {
      this.statusHistory.push({
        status: this.status,
        changedAt: new Date()
      });
    }
    // If payment status has changed, add to history
    if (this.isModified('paymentStatus')) {
      this.paymentHistory.push({
        status: this.paymentStatus,
        changedAt: new Date()
      });
    }
  }
  next();
});

module.exports = mongoose.model('Rental', rentalSchema);
