const express = require('express');
const menuController = require('../controllers/menuController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// mergeParams is required to access :restaurantId from the parent router
const router = express.Router({ mergeParams: true });

// Protect all menu management routes
router.use(protect);

router.route('/')
  .get(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.getMenu)
  .post(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.addCategory); // POST / to add category

router.route('/:categoryId')
  .put(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.editCategory)
  .delete(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.deleteCategory);

router.route('/items')
  .post(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.addMenuItem);

router.route('/items/:itemId')
  .put(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.editMenuItem)
  .delete(restrictTo('SUPER_ADMIN', 'OWNER'), menuController.deleteMenuItem);

module.exports = router;