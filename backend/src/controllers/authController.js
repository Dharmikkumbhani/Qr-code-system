const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const { user, token } = await authService.registerUser({ name, email, password, role });
    
    return sendSuccess(res, 201, 'User registered successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const { user, token } = await authService.loginUser(email, password);
    
    return sendSuccess(res, 200, 'Logged in successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

exports.updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id; // From protect middleware

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });

    return sendSuccess(res, 200, 'Push token updated successfully', { user: updatedUser });
  } catch (error) {
    next(error);
  }
};
