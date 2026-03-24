const { AppError } = require('../errors/AppError');

/**
 * Global Error Handler (upgraded).
 *
 * Catches ALL errors thrown or passed via next(err) in the Express pipeline.
 * - AppError subclasses → returns the typed status code and message.
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

  // --- Unexpected / programming errors ---
  console.error('[UNEXPECTED ERROR]', err.stack);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });
};

module.exports = errorHandler;
