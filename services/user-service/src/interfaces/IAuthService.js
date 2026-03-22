/**
 * @interface IAuthService
 * Defines the contract for authentication/security infrastructure.
 * Abstracts away bcryptjs and jsonwebtoken so the controller never touches them directly.
 */
class IAuthService {
  /**
   * Hash a plain-text password.
   * @param {string} plainTextPassword
   * @param {number} [saltRounds=10]
   * @returns {Promise<string>} The hashed password.
   */
  async hashPassword(plainTextPassword, saltRounds) {
    throw new Error('IAuthService.hashPassword() not implemented');
  }

  /**
   * Compare a plain-text password against a hashed password.
   * @param {string} plainTextPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  async comparePassword(plainTextPassword, hashedPassword) {
    throw new Error('IAuthService.comparePassword() not implemented');
  }

  /**
   * Generate a signed JWT token.
   * @param {Object} payload - e.g., { userId, email, role }
   * @param {string} [expiresIn='24h']
   * @returns {string} The signed token.
   */
  generateToken(payload, expiresIn) {
    throw new Error('IAuthService.generateToken() not implemented');
  }

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
