const IVehicleServiceClient = require('../interfaces/IVehicleServiceClient');
const axios = require('axios');

/**
 * HttpVehicleServiceClient
 * Concrete implementation that communicates with vehicle-service via HTTP.
 * This is the ONLY place in rental-service where axios calls to vehicle-service happen.
 */
class HttpVehicleServiceClient extends IVehicleServiceClient {
  constructor() {
    super();
    this.vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:3002';
  }

  async getVehicle(vehicleId, authHeader) {
    try {
      const response = await axios.get(
        `${this.vehicleServiceUrl}/vehicles/${vehicleId}`,
        { headers: { Authorization: authHeader } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Vehicle service error:', error.message);
      return null;
    }
  }

  async updateVehicleStatus(vehicleId, newStatus, authHeader) {
    try {
      await axios.patch(
        `${this.vehicleServiceUrl}/vehicles/${vehicleId}/status`,
        { status: newStatus },
        { headers: { Authorization: authHeader } }
      );
    } catch (error) {
      console.error('Could not update vehicle status:', error.message);
    }
  }
}

module.exports = HttpVehicleServiceClient;
