const IActivityLogger = require('../interfaces/IActivityLogger');
const axios = require('axios');

/**
 * HttpActivityLogger
 * Concrete implementation that sends activity logs to admin-service via HTTP.
 * Failures are swallowed to avoid disrupting the main flow.
 */
class HttpActivityLogger extends IActivityLogger {
  constructor() {
    super();
    this.adminServiceUrl = process.env.ADMIN_SERVICE_URL || 'http://admin-service:3006';
  }

  async logActivity(data) {
    try {
      const response = await axios.post(
        `${this.adminServiceUrl}/api/admin/activities/service-log`,
        data
      );
      console.log('Activity logged successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to log activity:', error.message);
      return null;
    }
  }

  async logVehicleActivity(userId, userRole, activityType, vehicleDetails) {
    try {
      await this.logActivity({
        userId,
        userRole,
        activityType,
        details: {
          ...vehicleDetails,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging vehicle activity:', error);
    }
  }
}

module.exports = HttpActivityLogger;
