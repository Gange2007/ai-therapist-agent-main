const Mood = require('../models/Mood');
const asyncHandler = require('../middleware/asyncHandler');

/** Derive a human-readable emotion label from a numeric score (0–100) */
function scoreToEmotion(score) {
  if (score <= 10) return 'Very Low';
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Neutral';
  if (score <= 80) return 'Good';
  return 'Great';
}

// @desc    Create a mood entry
// @route   POST /api/mood
// @access  Private
const createMoodEntry = asyncHandler(async (req, res) => {
  const { score, emotion, notes } = req.body;

  console.log('[moodController] createMoodEntry payload:', { score, emotion, notes, userId: req.user._id });

  if (typeof score !== 'number' || score < 0 || score > 100) {
    res.status(400);
    throw new Error('Score must be a number between 0 and 100');
  }

  // Derive emotion from score if not supplied by client
  const resolvedEmotion = emotion || scoreToEmotion(score);

  const mood = await Mood.create({
    userId: req.user._id,
    score,
    emotion: resolvedEmotion,
    notes,
  });

  console.log('[moodController] Mood entry created:', mood._id);
  res.status(201).json(mood);
});

// @desc    Get all mood entries for a user
// @route   GET /api/mood
// @access  Private
const getMoodEntries = asyncHandler(async (req, res) => {
  const moods = await Mood.find({ userId: req.user._id })
    .sort({ timestamp: -1 })
    .limit(100);

  res.json(moods);
});

// @desc    Get mood trend data
// @route   GET /api/mood/trend
// @access  Private
const getMoodTrend = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const moods = await Mood.find({
    userId: req.user._id,
    timestamp: { $gte: startDate },
  }).sort({ timestamp: 1 });

  // Calculate average mood per day
  const dailyAverages = {};
  moods.forEach((mood) => {
    const date = mood.timestamp.toISOString().split('T')[0];
    if (!dailyAverages[date]) {
      dailyAverages[date] = { total: 0, count: 0 };
    }
    dailyAverages[date].total += mood.score;
    dailyAverages[date].count += 1;
  });

  const trend = Object.keys(dailyAverages).map((date) => ({
    date,
    averageScore: dailyAverages[date].total / dailyAverages[date].count,
  }));

  res.json(trend);
});

// @desc    Delete a mood entry
// @route   DELETE /api/mood/:id
// @access  Private
const deleteMoodEntry = asyncHandler(async (req, res) => {
  const mood = await Mood.findById(req.params.id);

  if (!mood) {
    res.status(404);
    throw new Error('Mood entry not found');
  }

  // Check ownership
  if (mood.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this entry');
  }

  await mood.deleteOne();
  res.json({ message: 'Mood entry deleted successfully' });
});

module.exports = {
  createMoodEntry,
  getMoodEntries,
  getMoodTrend,
  deleteMoodEntry,
};
