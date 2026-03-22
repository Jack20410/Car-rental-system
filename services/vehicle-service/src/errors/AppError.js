/**
 * AppError - Base class for all application-level errors.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') { super(message, 400); }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') { super(`${resource} not found`, 404); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') { super(message, 401); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') { super(message, 403); }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') { super(message, 409); }
}

module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError };
