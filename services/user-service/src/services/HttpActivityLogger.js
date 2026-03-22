const IActivityLogger = require('../interfaces/IActivityLogger');
const axios = require('axios');

/**
 * HttpActivityLogger
 * Concrete implementation of IActivityLogger that sends activity logs
 * to the admin-service via HTTP (axios).
 *
 * Failures are swallowed (logged to console) to avoid disrupting the main flow.
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

  async logUserActivity(userId, userRole, activityType, details) {
    try {
      await this.logActivity({
        userId,
        userRole,
        activityType,
        details: {
          ...details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }
}

module.exports = HttpActivityLogger;
