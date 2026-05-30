const express = require('express');
const parcelController = require('../controllers/parcelController');
const { restrictTo } = require('../middlewares/authMiddleware');

// mergeParams: true allows access to :id from parent router (restaurantRoutes)
const router = express.Router({ mergeParams: true });

// All routes require OWNER or SUPER_ADMIN role
// Auth (protect) is already applied by the parent router

// GET  /restaurants/:id/parcels          → Get active parcels for today
// POST /restaurants/:id/parcels          → Add a new parcel
router.route('/')
  .get(restrictTo('SUPER_ADMIN', 'OWNER'), parcelController.getParcels)
  .post(restrictTo('SUPER_ADMIN', 'OWNER'), parcelController.addParcel);

// PATCH  /restaurants/:id/parcels/:parcelId/status  → Update parcel status
router.route('/:parcelId/status')
  .patch(restrictTo('SUPER_ADMIN', 'OWNER'), parcelController.updateParcelStatus);

// DELETE /restaurants/:id/parcels/:parcelId          → Mark as picked up (soft remove)
router.route('/:parcelId')
  .delete(restrictTo('SUPER_ADMIN', 'OWNER'), parcelController.removeParcel);

module.exports = router;
