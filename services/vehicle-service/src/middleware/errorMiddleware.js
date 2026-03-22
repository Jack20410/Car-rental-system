const multer = require('multer');
const { AppError } = require('../errors/AppError');

/**
 * Global Error Handler for vehicle-service.
 */
const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Maximum 10 files allowed.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.message === 'Not an image! Please upload only images.') {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('[UNEXPECTED ERROR]', err.stack);
  return res.status(500).json({ success: false, message: 'Something went wrong!' });
};

module.exports = errorHandler;
