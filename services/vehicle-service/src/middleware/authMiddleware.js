/**
 * Auth Middleware — Refactored (Phase 1: Clean Architecture)
 * Uses IAuthService via DI container instead of importing jsonwebtoken directly.
 */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const authService = req.container.resolve('authService');
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireCarProvider = (req, res, next) => {
  if (!req.user || req.user.role !== 'car_provider') {
    return res.status(403).json({ message: 'Access denied. Car provider role required.' });
  }
  next();
};

module.exports = { verifyToken, requireCarProvider };