/**
 * Auth Middleware — Refactored (Phase 1: Clean Architecture)
 *
 * Token verification delegated to IAuthService via DI container.
 * This middleware no longer imports jsonwebtoken directly.
 */

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const authService = req.container.resolve('authService');
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user has the required role(s)
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Convenience middleware exports for common roles
exports.requireCustomer = exports.requireRole('customer');
exports.requireCarProvider = exports.requireRole('car_provider');
exports.requireAdmin = exports.requireRole('admin');