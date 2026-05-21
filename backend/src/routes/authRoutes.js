const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/push-token', protect, authController.updatePushToken);

module.exports = router;
