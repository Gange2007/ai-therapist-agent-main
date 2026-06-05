const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create an activity entry
// @route   POST /api/activity
// @access  Private
const createActivity = asyncHandler(async (req, res) => {
  const { type, name, description, duration, completed, moodScore, moodNote } = req.body;

  console.log('[activityController] createActivity payload:', {
    type, name, description, duration, userId: req.user._id,
  });

  if (!type) {
    res.status(400);
    throw new Error('Activity type is required');
  }

  // Parse duration safely — frontend sends minutes as a string or number
  let parsedDuration = 0;
  if (duration !== undefined && duration !== null && duration !== '') {
    parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration < 0) parsedDuration = 0;
  }

  const activity = await Activity.create({
    userId: req.user._id,
    type,
    name: name || type,
    description: description || '',
    duration: parsedDuration,
    completed: completed !== undefined ? Boolean(completed) : true,
    moodScore: moodScore != null ? Number(moodScore) : null,
    moodNote: moodNote || '',
  });

  console.log('[activityController] Activity created:', activity._id);
  res.status(201).json(activity);
});

// @desc    Get all activities for a user
// @route   GET /api/activity
// @access  Private
const getActivities = asyncHandler(async (req, res) => {
  const { type, limit = 50 } = req.query;
  const query = { userId: req.user._id };

  if (type) query.type = type;

  const activities = await Activity.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json(activities);
});

// @desc    Get activity statistics
// @route   GET /api/activity/stats
// @access  Private
const getActivityStats = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const activities = await Activity.find({
    userId: req.user._id,
    timestamp: { $gte: startDate },
  });

  const stats = {
    totalActivities: activities.length,
    totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
    completedActivities: activities.filter((a) => a.completed).length,
    byType: {},
  };

  activities.forEach((activity) => {
    if (!stats.byType[activity.type]) {
      stats.byType[activity.type] = { count: 0, duration: 0 };
    }
    stats.byType[activity.type].count += 1;
    stats.byType[activity.type].duration += activity.duration || 0;
  });

  res.json(stats);
});

// @desc    Delete an activity
// @route   DELETE /api/activity/:id
// @access  Private
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  if (activity.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this activity');
  }

  await activity.deleteOne();
  res.json({ message: 'Activity deleted successfully' });
});

module.exports = {
  createActivity,
  getActivities,
  getActivityStats,
  deleteActivity,
};
