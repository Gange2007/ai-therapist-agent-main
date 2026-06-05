const ChatSession = require('../models/ChatSession');
const asyncHandler = require('../middleware/asyncHandler');
const { analyzeSentiment, detectCrisis, extractThemes } = require('../utils/mlService');
const { generateAIResponse } = require('../utils/aiService');

// @desc    Create a new chat session
// @route   POST /api/chat/sessions
// @access  Private
const createChatSession = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const chatSession = await ChatSession.create({
    userId: req.user._id,
    title: title || 'New Chat Session',
  });

  res.status(201).json(chatSession);
});

// @desc    Get all chat sessions for a user
// @route   GET /api/chat/sessions
// @access  Private
const getChatSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('userId', 'name email');

  res.json(sessions);
});

// @desc    Get a single chat session
// @route   GET /api/chat/sessions/:id
// @access  Private
const getChatSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  res.json(session);
});

// @desc    Send a message in a chat session
// @route   POST /api/chat/sessions/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  // Add user message
  session.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  // Analyze message with ML service
  let sentiment = null;
  let crisis = null;
  let themes = null;
  try {
    sentiment = await analyzeSentiment(message);
    crisis = await detectCrisis(message);
    themes = await extractThemes(message);
  } catch (error) {
    console.error('ML Service error:', error.message);
  }

  // Build session context for AI
  const sessionContext = {
    themes: themes?.themes || [],
    conversationGoal: session.metadata?.conversationGoal || 'Provide emotional support',
    messageCount: session.messages.length,
  };

  // Update session themes if available
  if (themes && themes.themes && themes.themes.length > 0) {
    if (!session.metadata) session.metadata = {};
    session.metadata.themes = themes.themes;
    session.metadata.primaryTheme = themes.primaryTheme;
  }

  // Generate AI response using OpenAI with enhanced context
  const aiResponse = await generateAIResponse(message, sentiment, crisis, session.messages, sessionContext);

  // Add AI response with enhanced metadata
  session.messages.push({
    role: 'assistant',
    content: aiResponse.content,
    timestamp: new Date(),
    metadata: {
      ...aiResponse.metadata,
      analysis: {
        emotionalState: sentiment?.sentiment || 'neutral',
        themes: themes?.themes || [],
        riskLevel: crisis?.riskLevel || 0,
        recommendedApproach: aiResponse.metadata.technique,
        progressIndicators: [],
      },
    },
  });

  // Track escalation requirements
  if (aiResponse.metadata.requiresEscalation) {
    if (!session.metadata) session.metadata = {};
    session.metadata.requiresEscalation = true;
    session.metadata.escalationReason = crisis?.flags?.join(', ') || 'High risk level detected';
    session.metadata.escalationTimestamp = new Date();
    session.status = 'escalated';
  }

  // Track sentiment and risk level history
  if (!session.metadata) session.metadata = {};
  if (!session.metadata.sentimentHistory) session.metadata.sentimentHistory = [];
  if (!session.metadata.riskLevelHistory) session.metadata.riskLevelHistory = [];

  if (sentiment) {
    session.metadata.sentimentHistory.push({
      sentiment: sentiment.sentiment,
      score: sentiment.score,
      timestamp: new Date(),
    });
  }

  if (crisis) {
    session.metadata.riskLevelHistory.push({
      riskLevel: crisis.riskLevel,
      timestamp: new Date(),
    });
  }

  // Update session title if it's the first message
  if (session.messages.length === 2) {
    session.title = message.substring(0, 30) + '...';
  }

  await session.save();

  res.json(session.messages[session.messages.length - 1]);
});

// @desc    Get chat history for a session
// @route   GET /api/chat/sessions/:id/history
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  res.json(session.messages);
});

// @desc    Complete a chat session
// @route   POST /api/chat/sessions/:id/complete
// @access  Private
const completeSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  session.status = 'completed';
  await session.save();

  res.json({ message: 'Session completed successfully' });
});

// @desc    Delete a chat session
// @route   DELETE /api/chat/sessions/:id
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  await session.deleteOne();
  res.json({ message: 'Session deleted successfully' });
});

// @desc    Request human escalation for a session
// @route   POST /api/chat/sessions/:id/escalate
// @access  Private
const requestEscalation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  if (!session.metadata) session.metadata = {};
  session.metadata.requiresEscalation = true;
  session.metadata.escalationReason = reason || 'User requested human assistance';
  session.metadata.escalationTimestamp = new Date();
  session.metadata.escalationRequestedBy = 'user';
  session.status = 'escalated';

  await session.save();

  res.json({
    message: 'Escalation request submitted successfully',
    escalationReason: session.metadata.escalationReason,
    escalationTimestamp: session.metadata.escalationTimestamp,
  });
});

// @desc    Get session analytics
// @route   GET /api/chat/sessions/:id/analytics
// @access  Private
const getSessionAnalytics = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check ownership
  if (session.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this session');
  }

  const analytics = {
    messageCount: session.messages.length,
    themes: session.metadata?.themes || [],
    primaryTheme: session.metadata?.primaryTheme || 'general',
    sentimentHistory: session.metadata?.sentimentHistory || [],
    riskLevelHistory: session.metadata?.riskLevelHistory || [],
    currentSentiment: session.metadata?.sentimentHistory?.[session.metadata.sentimentHistory.length - 1] || null,
    currentRiskLevel: session.metadata?.riskLevelHistory?.[session.metadata.riskLevelHistory.length - 1] || null,
    requiresEscalation: session.metadata?.requiresEscalation || false,
    escalationReason: session.metadata?.escalationReason || null,
  };

  res.json(analytics);
});

module.exports = {
  createChatSession,
  getChatSessions,
  getChatSession,
  sendMessage,
  getChatHistory,
  completeSession,
  deleteSession,
  requestEscalation,
  getSessionAnalytics,
};
