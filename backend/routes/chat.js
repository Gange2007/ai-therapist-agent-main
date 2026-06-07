const express = require('express');
const router = express.Router();
const {
  createChatSession,
  getChatSessions,
  getChatSession,
  sendMessage,
  getChatHistory,
  clearChatHistory,
  completeSession,
  deleteSession,
  requestEscalation,
  getSessionAnalytics,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.route('/sessions').post(protect, createChatSession).get(protect, getChatSessions);
router.route('/sessions/:id').get(protect, getChatSession).delete(protect, deleteSession);
router.post('/sessions/:id/messages', protect, sendMessage);
router.get('/sessions/:id/history', protect, getChatHistory);
router.delete('/sessions/:id/history', protect, clearChatHistory);
router.post('/sessions/:id/complete', protect, completeSession);
router.post('/sessions/:id/escalate', protect, requestEscalation);
router.get('/sessions/:id/analytics', protect, getSessionAnalytics);

module.exports = router;
