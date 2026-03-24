/**
 * @interface IVehicleServiceClient
 * Defines the contract for communicating with the remote Vehicle Service.
 * Abstracts the current direct axios calls to VEHICLE_SERVICE_URL.
 * This is the most crucial interface for testing — mocking it eliminates
 * all cross-service network traffic in tests.
 */
class IVehicleServiceClient {
  /**
   * Fetches vehicle representation from remote service.
   * @param {string} vehicleId - ID of the vehicle.
   * @param {string} authHeader - Reusable JWT bearer token (e.g., 'Bearer xyz').
   * @returns {Promise<Object>} The vehicle data object.
   * @throws {NotFoundError} if vehicle doesn't exist.
   */
  async getVehicle(vehicleId, authHeader) {
    throw new Error('IVehicleServiceClient.getVehicle() not implemented');
  }

  /**
   * Changes vehicle status remotely.
   * @param {string} vehicleId - ID of the vehicle.
   * @param {string} newStatus - New status value (e.g., 'Rented', 'Available').
   * @param {string} authHeader - Reusable JWT bearer token.
   * @returns {Promise<void>}
   */
  async updateVehicleStatus(vehicleId, newStatus, authHeader) {
    throw new Error('IVehicleServiceClient.updateVehicleStatus() not implemented');
  }
}

module.exports = IVehicleServiceClient;
