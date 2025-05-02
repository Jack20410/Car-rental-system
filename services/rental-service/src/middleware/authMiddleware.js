const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user is a customer
exports.requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customers only.'
    });
  }
  next();
};

// Middleware to check if user is a car provider
exports.requireCarProvider = (req, res, next) => {
  if (req.user.role !== 'car_provider') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Car providers only.'
    });
  }
  next();
};

// Middleware to check if user has one of the required roles
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// Middleware to check if user is an admin
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrators only.'
    });
  }
  next();
};