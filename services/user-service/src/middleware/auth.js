/**
 * Auth Middleware — Refactored (Phase 1: Clean Architecture)
 *
 * Uses IAuthService via the DI container instead of importing jsonwebtoken directly.
 */

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const authService = req.container.resolve('authService');
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = {
  verifyToken,
};