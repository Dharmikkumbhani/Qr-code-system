class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Indicates whether it's an expected error or programming bug

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
