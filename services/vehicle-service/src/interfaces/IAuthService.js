/**
 * @interface IAuthService
 * Defines the contract for authentication/security infrastructure.
 * Abstracts jsonwebtoken so the auth middleware never imports it directly.
 */
class IAuthService {
  /**
   * Verify and decode a JWT token.
   * @param {string} token
   * @returns {Object} The decoded payload.
   */
  verifyToken(token) {
    throw new Error('IAuthService.verifyToken() not implemented');
  }
}

module.exports = IAuthService;
