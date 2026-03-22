const multer = require('multer');
const { AppError } = require('../errors/AppError');

/**
 * Global Error Handler (upgraded).
 *
 * Catches ALL errors thrown or passed via next(err) in the Express pipeline.
 * - AppError subclasses → returns the typed status code and message.
 * - Multer errors → returns 400.
 * - Unknown errors → returns 500 with a generic message (never leaks stack traces in production).
 */
const errorHandler = (err, req, res, _next) => {
  // --- Operational / domain errors (thrown intentionally) ---
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // --- Multer file-upload errors (existing behaviour preserved) ---
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // --- Unexpected / programming errors ---
  console.error('[UNEXPECTED ERROR]', err.stack);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });
};

module.exports = errorHandler;