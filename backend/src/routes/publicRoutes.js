const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Public menu fetch by restaurant slug — no auth required
router.get('/menu/:restaurantSlug', publicController.getPublicMenu);

module.exports = router;
