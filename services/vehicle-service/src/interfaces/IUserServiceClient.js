/**
 * @interface IUserServiceClient
 * Defines the contract for fetching user details from the remote User Service.
 * Abstracts the current direct axios.get() call to USER_SERVICE_URL.
 */
class IUserServiceClient {
  /**
   * Fetch public user details by userId from the User Service.
   * @param {string} userId
   * @returns {Promise<Object|null>} The user data or null if not found.
   */
  async getUserDetails(userId) {
    throw new Error('IUserServiceClient.getUserDetails() not implemented');
  }
}

module.exports = IUserServiceClient;
