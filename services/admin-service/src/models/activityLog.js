const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['customer', 'car_provider'],
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_RENTAL_ORDER',
      'UPDATE_RENTAL_ORDER',
      'CANCEL_RENTAL_ORDER',
      'UPDATE_CAR_STATUS',
      'ADD_CAR',
      'UPDATE_CAR',
      'DELETE_CAR',
      'MAKE_PAYMENT',
      'ADD_RATING',
      'ADD_REVIEW'
    ],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: function() {
      // Create a date object and add 7 hours for GMT+7
      const now = new Date();
      now.setHours(now.getHours() + 7);
      return now;
    },
    index: true,
    get: function(date) {
      if (date) {
        const gmt7Date = new Date(date);
        gmt7Date.setHours(gmt7Date.getHours() + 7);
        return gmt7Date;
      }
      return date;
    }
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    currentTime: () => {
      const now = new Date();
      now.setHours(now.getHours() + 7);
      return now;
    }
  },
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for efficient querying by date ranges
activityLogSchema.index({ timestamp: -1 });

// Index for querying by user and activity type
activityLogSchema.index({ userId: 1, activityType: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog; 