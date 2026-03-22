/**
 * @interface IActivityLogger
 * Defines the contract for logging user activities to an external service.
 * Abstracts the current direct axios call to admin-service.
 */
class IActivityLogger {
  /**
   * Log raw activity data.
   * @param {Object} data - The activity payload.
   * @returns {Promise<Object|null>}
   */
  async logActivity(data) {
    throw new Error('IActivityLogger.logActivity() not implemented');
  }

  /**
   * Log a specific user action (convenience wrapper).
   * @param {string} userId
   * @param {string} userRole
   * @param {string} activityType - e.g., 'LOGIN', 'REGISTER'
   * @param {Object} details
   * @returns {Promise<void>}
   */
  async logUserActivity(userId, userRole, activityType, details) {
    throw new Error('IActivityLogger.logUserActivity() not implemented');
  }
}

module.exports = IActivityLogger;
