const OpenAI = require('openai');

// Initialize OpenAI client lazily
let openai = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Generate AI response using OpenAI ChatGPT
 * @param {string} userMessage - The user's message
 * @param {object} sentiment - Sentiment analysis result from ML service
 * @param {object} crisis - Crisis detection result from ML service
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {object} sessionContext - Additional session context (themes, progress, etc.)
 * @returns {Promise<object>} - AI response with content and metadata
 */
async function generateAIResponse(userMessage, sentiment, crisis, conversationHistory = [], sessionContext = {}) {
  // Check if OpenAI is configured
  const client = getOpenAIClient();
  if (!client) {
    console.log('OpenAI API key not configured, using fallback responses');
    return getFallbackResponse(userMessage, sentiment, crisis, sessionContext);
  }

  try {
    // Build enhanced system prompt with dialogue management
    let systemPrompt = `You are Aura, a compassionate and supportive AI therapist assistant. Your role is to:
- Listen actively and empathetically to users' concerns
- Provide supportive and non-judgmental responses
- Use evidence-based therapeutic techniques when appropriate (CBT, DBT, mindfulness, etc.)
- Validate users' feelings and experiences
- Ask thoughtful follow-up questions to deepen understanding
- Maintain professional boundaries while being warm and caring
- If crisis is detected, prioritize safety and provide appropriate resources
- Track conversation themes and progress over multiple turns
- Recognize when human escalation may be needed

Keep responses concise (2-3 sentences typically), warm, and conversational. Avoid overly clinical language.`;

    // Add session context to system prompt
    if (sessionContext.themes && sessionContext.themes.length > 0) {
      systemPrompt += `\n\nCurrent session themes: ${sessionContext.themes.join(', ')}. Keep these in mind as you respond.`;
    }

    if (sessionContext.conversationGoal) {
      systemPrompt += `\n\nCurrent conversation goal: ${sessionContext.conversationGoal}`;
    }

    // Adjust system prompt based on sentiment
    if (sentiment && sentiment.sentiment === 'negative') {
      systemPrompt += `\n\nThe user appears to be experiencing negative emotions. Be extra empathetic and validating. Focus on acknowledging their feelings and offering support. Use techniques like reflection and validation.`;
    } else if (sentiment && sentiment.sentiment === 'positive') {
      systemPrompt += `\n\nThe user seems to be in a positive state. Reinforce positive coping strategies and celebrate progress while maintaining realistic expectations.`;
    }

    // Adjust system prompt based on crisis level
    if (crisis && crisis.riskLevel >= 7) {
      systemPrompt += `\n\nCRITICAL: The user may be in crisis (risk level ${crisis.riskLevel}/10). Prioritize safety immediately. Provide crisis resources and encourage seeking professional help. Be direct about safety concerns while remaining supportive. Consider recommending human escalation.`;
    } else if (crisis && crisis.riskLevel >= 4) {
      systemPrompt += `\n\nThe user shows moderate distress signals. Be attentive and supportive. Monitor for escalation. Consider suggesting professional resources if distress persists.`;
    }

    // Build conversation context with intent recognition
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for better context)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Call OpenAI API with enhanced parameters
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 350,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });

    const aiResponse = completion.choices[0].message.content;

    // Determine metadata with enhanced tracking
    let metadata = {
      technique: 'supportive_conversation',
      goal: 'Provide emotional support',
      model: 'gpt-4o-mini',
      progress: [],
      sentiment: sentiment?.sentiment || 'neutral',
      riskLevel: crisis?.riskLevel || 0,
      requiresEscalation: false,
    };

    // Determine technique based on context
    if (crisis && crisis.riskLevel >= 7) {
      metadata.technique = 'crisis_intervention';
      metadata.goal = 'Ensure safety and provide resources';
      metadata.requiresEscalation = true;
    } else if (sentiment && sentiment.sentiment === 'negative') {
      metadata.technique = 'empathetic_validation';
      metadata.goal = 'Validate emotions and provide support';
    } else if (sessionContext.themes && sessionContext.themes.includes('anxiety')) {
      metadata.technique = 'anxiety_management';
      metadata.goal = 'Help manage anxiety symptoms';
    } else if (sessionContext.themes && sessionContext.themes.includes('depression')) {
      metadata.technique = 'depression_support';
      metadata.goal = 'Provide depression support';
    }

    return {
      content: aiResponse,
      metadata,
    };

  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    return getFallbackResponse(userMessage, sentiment, crisis, sessionContext);
  }
}

function getFallbackResponse(userMessage, sentiment, crisis, sessionContext = {}) {
  let fallbackResponse = "I'm here to support you. Could you tell me more about what's on your mind?";
  let fallbackMetadata = {
    technique: 'supportive',
    goal: 'Provide support',
    model: 'fallback',
    progress: [],
    sentiment: sentiment?.sentiment || 'neutral',
    riskLevel: crisis?.riskLevel || 0,
    requiresEscalation: false,
  };

  if (crisis && crisis.riskLevel >= 7) {
    fallbackResponse = "I'm concerned about what you're sharing. If you're in immediate danger, please call emergency services (911 in the US) or reach out to a crisis hotline. You're not alone, and there are people who want to help.";
    fallbackMetadata = {
      technique: 'crisis_intervention',
      goal: 'Ensure safety',
      model: 'fallback',
      progress: [],
      sentiment: sentiment?.sentiment || 'negative',
      riskLevel: crisis.riskLevel,
      requiresEscalation: true,
    };
  } else if (sentiment && sentiment.sentiment === 'negative') {
    fallbackResponse = "I hear that you're going through a difficult time. It's brave of you to share this. Let's work through this together.";
    fallbackMetadata = {
      technique: 'empathetic_listening',
      goal: 'Validate emotions',
      model: 'fallback',
      progress: [],
      sentiment: 'negative',
      riskLevel: crisis?.riskLevel || 0,
      requiresEscalation: false,
    };
  }

  return {
    content: fallbackResponse,
    metadata: fallbackMetadata,
  };
}

module.exports = {
  generateAIResponse,
};
