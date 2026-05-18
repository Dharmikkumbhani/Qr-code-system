const express = require('express');
const orderController = require('../controllers/orderController');
const { protectCustomer } = require('../middlewares/customerAuthMiddleware');

const router = express.Router();

// All order routes require customer JWT
router.use(protectCustomer);

router.post('/', orderController.placeOrder);
router.get('/:orderId', orderController.getOrder);

module.exports = router;
