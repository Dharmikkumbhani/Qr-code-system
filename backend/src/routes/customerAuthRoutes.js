const express = require('express');
const customerAuthController = require('../controllers/customerAuthController');

const router = express.Router();

// Legacy: direct login without OTP (kept for backward compat)
router.post('/login', customerAuthController.loginOrRegister);

// OTP-based flow
router.post('/send-otp', customerAuthController.sendOtp);
router.post('/verify-otp', customerAuthController.verifyOtp);

module.exports = router;
