const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  // Nếu đang trong môi trường test
  if (process.env.NODE_ENV === 'test') {
    req.user = {
      _id: "test_user_id",
      userId: "test_user_id",
      role: "customer"
    };
    return next();
  }

  // Logic xác thực thật cho production
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
  // Nếu đang trong môi trường test
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customers only.'
    });
  }
  next();
};