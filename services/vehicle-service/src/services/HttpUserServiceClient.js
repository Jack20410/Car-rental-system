const IUserServiceClient = require('../interfaces/IUserServiceClient');
const axios = require('axios');

/**
 * HttpUserServiceClient
 * Concrete implementation that fetches user details via HTTP from the User Service.
 * This is the ONLY place in vehicle-service where axios calls to user-service happen.
 */
class HttpUserServiceClient extends IUserServiceClient {
  constructor() {
    super();
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  }

  async getUserDetails(userId) {
    try {
      const response = await axios.get(`${this.userServiceUrl}/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error.message);
      return null;
    }
  }
}

module.exports = HttpUserServiceClient;
