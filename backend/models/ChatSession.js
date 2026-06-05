const mongoose = require('mongoose');
const Message = require('./Message');

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Chat Session',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'escalated'],
    default: 'active',
  },
  summary: {
    type: String,
  },
  messages: [Message.schema],
  metadata: {
    themes: [String],
    primaryTheme: String,
    conversationGoal: String,
    requiresEscalation: {
      type: Boolean,
      default: false,
    },
    escalationReason: String,
    escalationTimestamp: Date,
    sentimentHistory: [{
      sentiment: String,
      score: Number,
      timestamp: Date,
    }],
    riskLevelHistory: [{
      riskLevel: Number,
      timestamp: Date,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
chatSessionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
