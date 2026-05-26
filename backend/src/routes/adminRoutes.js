const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Restrict all routes to SUPER_ADMIN only
router.use(restrictTo('SUPER_ADMIN'));

// Platform statistics
router.get('/stats', adminController.getPlatformStats);

// Restaurant management
router.get('/restaurants', adminController.getAllRestaurantsDetailed);
router.patch('/restaurants/:id/subscription', adminController.updateSubscriptionStatus);

// Platform analytics
router.get('/analytics', adminController.getPlatformAnalytics);

// Subscription overview
router.get('/subscriptions', adminController.getSubscriptionOverview);

// Recent activity
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
