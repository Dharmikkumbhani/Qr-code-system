const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/errors');

exports.protectCustomer = async (req, res, next) => {
  try {
    let token;
    
    // 1. Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in! Please provide your phone number to get access.', 401));
    }
    
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // 3. Prevent Admin/Owner from using this route (Optional, depending on use cases)
    if (decoded.role !== 'CUSTOMER') {
        return next(new AppError('Invalid token role. Expected Customer.', 403));
    }
    
    // 4. Check if customer still exists
    const currentCustomer = await prisma.customer.findUnique({ where: { id: decoded.id } });
    if (!currentCustomer) {
      return next(new AppError('The customer belonging to this token no longer exists.', 401));
    }
    
    // Grant access to protected route
    req.customer = currentCustomer;
    next();
  } catch (error) {
    next(error); 
  }
};
