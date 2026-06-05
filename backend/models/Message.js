const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    technique: String,
    goal: String,
    progress: [mongoose.Schema.Types.Mixed],
    analysis: {
      emotionalState: String,
      themes: [String],
      riskLevel: Number,
      recommendedApproach: String,
      progressIndicators: [String],
    },
  },
});

module.exports = mongoose.model('Message', messageSchema);
