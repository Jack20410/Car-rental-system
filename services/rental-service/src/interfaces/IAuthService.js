/**
 * @interface IAuthService
 * Defines the contract for authentication/security infrastructure.
 * Abstracts away jsonwebtoken so the middleware never touches it directly.
 *
 * Note: rental-service only needs verifyToken (not hash/compare/generate)
 * because it delegates authentication verification only.
 */
class IAuthService {
  /**
   * Verify and decode a JWT token.
   * @param {string} token
   * @returns {Object} The decoded payload (e.g., { userId, email, role }).
   * @throws {Error} If token is invalid or expired.
   */
  verifyToken(token) {
    throw new Error('IAuthService.verifyToken() not implemented');
  }
}

module.exports = IAuthService;
