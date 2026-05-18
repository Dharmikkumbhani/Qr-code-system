const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Prisma Specific Errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    err.message = `Duplicate value for ${field}. Please use another value.`;
    err.statusCode = 400;
  }
  
  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token. Please log in again.';
    err.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Your token has expired! Please log in again.';
    err.statusCode = 401;
  }

  // Development VS Production error responses can be separated here
  console.error('ERROR 💥', err);

  return sendError(res, err.statusCode, err.message, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;
