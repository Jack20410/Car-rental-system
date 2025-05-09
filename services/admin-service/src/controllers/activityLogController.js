const ActivityLog = require('../models/activityLog');

// Helper function to convert date to GMT+7
const convertToGMT7 = (date) => {
  const gmt7Date = new Date(date);
  gmt7Date.setHours(gmt7Date.getHours() + 7);
  return gmt7Date;
};

const activityLogController = {
  // Log a new activity
  logActivity: async (req, res) => {
    try {
      const { userId, userRole, activityType, details } = req.body;
      
      const activityLog = new ActivityLog({
        userId,
        userRole,
        activityType,
        details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      await activityLog.save();
      
      res.status(201).json({
        success: true,
        message: 'Activity logged successfully',
        data: activityLog
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to log activity',
        error: error.message
      });
    }
  },

  // Get activities by user ID
  getUserActivities: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, startDate, endDate } = req.query;

      const query = { userId };

      // Add date range filter if provided with GMT+7 adjustment
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          const startDateTime = convertToGMT7(new Date(startDate));
          startDateTime.setHours(0, 0, 0, 0);
          query.timestamp.$gte = startDateTime;
        }
        if (endDate) {
          const endDateTime = convertToGMT7(new Date(endDate));
          endDateTime.setHours(23, 59, 59, 999);
          query.timestamp.$lte = endDateTime;
        }
      }

      const activities = await ActivityLog
        .find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await ActivityLog.countDocuments(query);

      res.status(200).json({
        success: true,
        data: activities,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activities',
        error: error.message
      });
    }
  },

  // Get all activities with filtering and pagination
  getAllActivities: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        userRole, 
        activityType, 
        startDate, 
        endDate 
      } = req.query;

      const query = {};

      if (userRole) query.userRole = userRole;
      if (activityType) query.activityType = activityType;

      // Add date range filter if provided with GMT+7 adjustment
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          const startDateTime = convertToGMT7(new Date(startDate));
          startDateTime.setHours(0, 0, 0, 0);
          query.timestamp.$gte = startDateTime;
        }
        if (endDate) {
          const endDateTime = convertToGMT7(new Date(endDate));
          endDateTime.setHours(23, 59, 59, 999);
          query.timestamp.$lte = endDateTime;
        }
      }

      const activities = await ActivityLog
        .find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await ActivityLog.countDocuments(query);

      res.status(200).json({
        success: true,
        data: activities,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: error.message
      });
    }
  },

  // Get activity statistics
  getActivityStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const query = {};
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          const startDateTime = convertToGMT7(new Date(startDate));
          startDateTime.setHours(0, 0, 0, 0);
          query.timestamp.$gte = startDateTime;
        }
        if (endDate) {
          const endDateTime = convertToGMT7(new Date(endDate));
          endDateTime.setHours(23, 59, 59, 999);
          query.timestamp.$lte = endDateTime;
        }
      }

      const stats = await ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              activityType: '$activityType',
              userRole: '$userRole'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.userRole',
            activities: {
              $push: {
                type: '$_id.activityType',
                count: '$count'
              }
            },
            totalActivities: { $sum: '$count' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching activity statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity statistics',
        error: error.message
      });
    }
  }
};

module.exports = activityLogController; 