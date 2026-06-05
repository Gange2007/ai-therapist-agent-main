const express = require('express');
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityStats,
  deleteActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createActivity).get(protect, getActivities);
router.get('/stats', protect, getActivityStats);
router.delete('/:id', protect, deleteActivity);

module.exports = router;
