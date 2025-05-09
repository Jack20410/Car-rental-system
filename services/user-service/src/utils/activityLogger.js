const axios = require('axios');

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://admin-service:3006';

const logActivity = async (data) => {
  try {
    const response = await axios.post(`${ADMIN_SERVICE_URL}/api/activities/service-log`, data);
    console.log('Activity logged successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    // Don't throw error to prevent disrupting the main flow
    return null;
  }
};

const logUserActivity = async (userId, userRole, activityType, details) => {
  try {
    await logActivity({
      userId,
      userRole,
      activityType,
      details: {
        ...details,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

module.exports = {
  logActivity,
  logUserActivity
}; 