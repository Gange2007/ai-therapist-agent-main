const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    // Extended to cover all types the frontend form sends
    enum: [
      'breathing', 'garden', 'forest', 'waves',
      'meditation', 'exercise', 'walking', 'reading',
      'journaling', 'therapy', 'game', 'other',
    ],
    required: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Duration stored in minutes (frontend sends minutes)
  duration: {
    type: Number,
    required: false,   // not required — user may skip it
    default: 0,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: true,
  },
  moodScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  moodNote: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Activity', activitySchema);
