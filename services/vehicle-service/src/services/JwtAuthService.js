const IAuthService = require('../interfaces/IAuthService');
const jwt = require('jsonwebtoken');

/**
 * JwtAuthService
 * Concrete implementation of IAuthService using jsonwebtoken.
 * This is the ONLY place in vehicle-service where jwt is imported.
 */
class JwtAuthService extends IAuthService {
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

module.exports = JwtAuthService;
