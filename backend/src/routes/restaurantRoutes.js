const express = require('express');
const restaurantController = require('../controllers/restaurantController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Only Super Admins can view all restaurants and create new ones
router.route('/')
  .get(restrictTo('SUPER_ADMIN'), restaurantController.getAllRestaurants)
  .post(restrictTo('SUPER_ADMIN'), restaurantController.createRestaurant);

// Tables Management
router.route('/:id/tables')
  .get(restrictTo('SUPER_ADMIN', 'OWNER'), restaurantController.getTables)
  .post(restrictTo('SUPER_ADMIN', 'OWNER'), restaurantController.generateTables);

module.exports = router;
