const customerAuthService = require('../services/customerAuthService');
const { sendSuccess } = require('../utils/response');

// Legacy: direct login/register without OTP
exports.loginOrRegister = async (req, res, next) => {
  try {
    const { phoneNumber, name } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number' });
    }

    const { customer, token } = await customerAuthService.loginOrRegisterCustomer(phoneNumber, name);
    return sendSuccess(res, 200, 'Customer authenticated successfully', { customer, token });
  } catch (error) {
    next(error);
  }
};

// Step 1: Send OTP to phone number
exports.sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    await customerAuthService.sendOtp(phoneNumber);

    return sendSuccess(res, 200, 'OTP sent successfully', {
      // In dev mode, hint the OTP so testing is easy
      devHint: process.env.NODE_ENV === 'production' ? undefined : 'Use OTP: 123456'
    });
  } catch (error) {
    next(error);
  }
};

// Step 2: Verify OTP → return customer + JWT
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp, name } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const { customer, token } = await customerAuthService.verifyOtp(phoneNumber, otp, name);
    return sendSuccess(res, 200, 'Customer authenticated successfully', { customer, token });
  } catch (error) {
    next(error);
  }
};
