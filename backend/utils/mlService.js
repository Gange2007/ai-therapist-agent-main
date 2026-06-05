const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @desc    Analyze sentiment of text
// @param   {string} text - Text to analyze
// @returns {object} Sentiment analysis result
const analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/sentiment`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    // Return default sentiment if ML service is unavailable
    return {
      sentiment: 'neutral',
      score: 0.5,
      emotions: { positive: 0.5, negative: 0.5 },
      riskLevel: 0,
      model: 'fallback',
    };
  }
};

// @desc    Detect crisis signals in text
// @param   {string} text - Text to analyze
// @returns {object} Crisis detection result
const detectCrisis = async (text) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/crisis`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error('Crisis detection error:', error.message);
    // Return default crisis detection if ML service is unavailable
    return {
      riskLevel: 0,
      flags: [],
      requiresIntervention: false,
      hasNegation: false,
    };
  }
};

// @desc    Get recommended therapeutic technique
// @param   {string} text - User's message
// @returns {object} Technique recommendation
const getTechnique = async (text) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/technique`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error('Technique recommendation error:', error.message);
    return {
      technique: 'supportive_listening',
      description: 'Active listening and empathetic response',
    };
  }
};

// @desc    Extract themes from text
// @param   {string} text - Text to analyze
// @returns {object} Theme extraction result
const extractThemes = async (text) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/themes`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error('Theme extraction error:', error.message);
    return {
      themes: [],
      primaryTheme: 'general',
    };
  }
};

// @desc    Get mood trend analysis
// @param   {array} moodData - Array of mood entries
// @returns {object} Mood trend analysis
const getMoodTrend = async (moodData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/mood-trend`, {
      data: moodData,
    });
    return response.data;
  } catch (error) {
    console.error('Mood trend analysis error:', error.message);
    return {
      trend: 'stable',
      prediction: 'stable',
      confidence: 0.5,
    };
  }
};

module.exports = {
  analyzeSentiment,
  detectCrisis,
  getTechnique,
  extractThemes,
  getMoodTrend,
};
