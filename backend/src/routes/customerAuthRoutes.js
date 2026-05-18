const express = require('express');
const customerAuthController = require('../controllers/customerAuthController');

const router = express.Router();

router.post('/login', customerAuthController.loginOrRegister);

module.exports = router;
