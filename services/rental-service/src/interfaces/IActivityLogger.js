/**
 * @interface IActivityLogger
 * Defines the contract for logging rental activities to an external service.
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
   * Log a specific rental action (convenience wrapper).
   * @param {string} userId
   * @param {string} userRole
   * @param {string} activityType - e.g., 'CREATE_RENTAL_ORDER', 'UPDATE_RENTAL_ORDER'
   * @param {Object} details
   * @returns {Promise<void>}
   */
  async logRentalActivity(userId, userRole, activityType, details) {
    throw new Error('IActivityLogger.logRentalActivity() not implemented');
  }
}

module.exports = IActivityLogger;
