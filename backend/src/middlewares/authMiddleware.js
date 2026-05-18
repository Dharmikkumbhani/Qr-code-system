const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/errors');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // 1. Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    
    // 3. Check if user still exists
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(error); // This will be caught by global errorHandler (handles TokenExpiredError, etc.)
  }
};

// Middleware to restrict access based on roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
