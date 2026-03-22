/**
 * @interface IActivityLogger
 * Defines the contract for logging activities to the admin-service.
 */
class IActivityLogger {
  /**
   * Log raw activity data.
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async logActivity(data) {
    throw new Error('IActivityLogger.logActivity() not implemented');
  }

  /**
   * Log a vehicle-specific action.
   * @param {string} userId
   * @param {string} userRole
   * @param {string} activityType - e.g., 'ADD_CAR', 'UPDATE_CAR'
   * @param {Object} vehicleDetails
   * @returns {Promise<void>}
   */
  async logVehicleActivity(userId, userRole, activityType, vehicleDetails) {
    throw new Error('IActivityLogger.logVehicleActivity() not implemented');
  }
}

module.exports = IActivityLogger;
