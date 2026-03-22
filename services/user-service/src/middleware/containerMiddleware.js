const container = require('../config/container');

/**
 * Express middleware that attaches a scoped DI container to every request.
 *
 * Usage in index.js:
 *   const { scopePerRequest } = require('./middleware/containerMiddleware');
 *   app.use(scopePerRequest);
 *
 * Usage inside any controller:
 *   const userRepository = req.container.resolve('userRepository');
 *   const authService     = req.container.resolve('authService');
 */
const scopePerRequest = (req, res, next) => {
  req.container = container;
  next();
};

module.exports = { scopePerRequest };
