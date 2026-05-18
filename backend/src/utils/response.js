/**
 * Standardize success responses
 */
exports.sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standardize error responses (often used manually before global error handler kicks in)
 */
exports.sendError = (res, statusCode, message, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
