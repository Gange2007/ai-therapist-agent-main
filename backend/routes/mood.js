const express = require('express');
const router = express.Router();
const {
  createMoodEntry,
  getMoodEntries,
  getMoodTrend,
  deleteMoodEntry,
} = require('../controllers/moodController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createMoodEntry).get(protect, getMoodEntries);
router.get('/trend', protect, getMoodTrend);
router.delete('/:id', protect, deleteMoodEntry);

module.exports = router;
