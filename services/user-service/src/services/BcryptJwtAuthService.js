const IAuthService = require('../interfaces/IAuthService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * BcryptJwtAuthService
 * Concrete implementation of IAuthService using bcryptjs + jsonwebtoken.
 *
 * This class is the ONLY place in the application where bcrypt and jwt
 * should be imported and used.
 */
class BcryptJwtAuthService extends IAuthService {
  async hashPassword(plainTextPassword, saltRounds = 10) {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(plainTextPassword, salt);
  }

  async comparePassword(plainTextPassword, hashedPassword) {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

module.exports = BcryptJwtAuthService;
