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
  const client = getOpenAIClient();
  if (!client) {
    console.warn('OpenAI API key not configured. Returning clinical fallback response.');
    return getFallbackResponse(userMessage, sentiment, crisis, sessionContext);
  }

  try {
    let systemPrompt = `You are Aura, a clinically-oriented companion who communicates clearly and safely about health concerns.

Instructions:
1. Use a concise, clinician-style tone: be precise, neutral, and empathetic.
2. Do not diagnose. Frame any suggested causes as possibilities and include the line: "I am not a doctor. This is not medical advice. If you are concerned, please seek evaluation from a healthcare professional.".
3. When a user reports physical symptoms, respond with:
  - A brief acknowledgement.
  - A short list (•) of plausible, high-level causes (max 4), clearly labelled as possibilities.
  - A short list (•) of safe self-care steps they can try immediately (avoid medication recommendations).
  - 2 focused clinician-style questions to establish onset, severity, and red flags (e.g., "When did this start?", "On a scale of 1-10, how severe is it?").
  - If red-flag symptoms are present, instruct the user to seek immediate emergency care and provide local emergency/call guidance when feasible.
4. Prioritize safety: if unsure, recommend professional evaluation rather than speculation.
5. Keep responses structured and clear; use bullet points (•) for lists.
6. If the conversation is primarily emotional (stress, anxiety, depression), combine clinical clarification questions with supportive wording and referral suggestions when appropriate.`;

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
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await client.chat.completions.create({
      model,
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
      model,
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
    console.error('[aiService] OpenAI API Error:', {
      message: error.message,
      stack: error.stack,
      userMessage: userMessage?.substring(0, 50),
      sentiment: sentiment?.sentiment,
      crisis: crisis?.riskLevel,
    });
    return getFallbackResponse(userMessage, sentiment, crisis, sessionContext);
  }
}

function getFallbackResponse(userMessage, sentiment, crisis, sessionContext = {}) {
  const normalized = (userMessage || '').toLowerCase();

  const symptomMatchers = [
    {
      key: 'headache',
      technique: 'symptom_headache',
      goal: 'Clarify headache and next safe steps',
      match: () =>
        /\b(headache|migraine|head pain|head hurt)\b/.test(normalized) ||
        (normalized.includes('head') && (normalized.includes('ache') || normalized.includes('hurt'))),
      build: () =>
        `I'm sorry you're dealing with a headache — that can be really draining.

Possible causes might include:
• Dehydration or not eating enough
• Stress/tension or poor posture
• Lack of sleep or irregular sleep
• Eye strain (screens/bright light)
• Recent illness or sinus irritation (general possibilities)

Self-care steps you can try now:
• Drink water (and eat something light if you haven't)
• Rest in a dim/quiet space for a short period
• Take screen breaks and consider gentle neck/shoulder relaxation
• Try a simple calming routine (slow breathing) if stress seems involved

Follow-up questions:
• When did the headache start, and was it sudden or gradual?
• On a scale of 1-10, how severe is the pain right now?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'knee pain',
      technique: 'symptom_knee_pain',
      goal: 'Clarify knee pain and safe care',
      match: () => /\b(knee pain|knee hurt|pain in my knee|aching knee)\b/.test(normalized),
      build: () =>
        `I'm sorry you're dealing with knee pain — it can make everyday movement frustrating.

Possible causes might include:
• Overuse/strain from activity
• A minor injury (twist/impact/sprain)
• Inflammation of tissues around the knee
• Wear-and-tear/arthritis-like changes (general possibility)
• Muscle imbalance or altered mechanics

Self-care steps you can try now:
• Rest the knee and avoid painful movements for a day or two
• Ice for 15–20 minutes at a time after activity (if it helps)
• Consider gentle compression/support if comfortable (avoid restricting circulation)
• Use supportive footwear and keep weight-bearing as comfortable

Follow-up questions:
• When did the knee pain start, and was there an injury or workout beforehand?
• Is there swelling or warmth, and can you put weight on it normally?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'back pain',
      technique: 'symptom_back_pain',
      goal: 'Clarify back pain and safe care',
      match: () => /\b(back pain|lower back pain|lumbar pain|spine pain)\b/.test(normalized),
      build: () =>
        `I'm sorry you're experiencing back pain — it can make it hard to sit, move, and rest.

Possible causes might include:
• Muscle strain or ligament irritation
• Poor posture or prolonged sitting
• Overuse from lifting/bending/twisting
• Stress-related muscle tension
• Irritation of joints/spine structures (general possibilities)

Self-care steps you can try now:
• Take it a bit easier for 24–48 hours (avoid movements that sharply worsen pain)
• Use gentle heat or ice for comfort (whichever feels better)
• Try light movement/short walks if they don’t worsen symptoms
• Consider gentle stretching only if it feels safe and does not increase pain

Follow-up questions:
• Where exactly is the pain (low back/mid back), and did it start after lifting or a sudden movement?
• Any pain spreading down a leg, numbness/tingling, or trouble controlling bladder/bowel?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'neck pain',
      technique: 'symptom_neck_pain',
      goal: 'Clarify neck pain and safe care',
      match: () => /\b(neck pain|sore neck|cervical pain|pain in my neck)\b/.test(normalized),
      build: () =>
        `I'm sorry your neck is hurting — neck pain can be stubborn and distracting.

Possible causes might include:
• Muscle strain from posture or sleep position
• Tension related to stress
• Prolonged screen use
• Minor sprain/overuse (general possibility)
• Irritation from a recent activity or movement

Self-care steps you can try now:
• Take screen breaks and keep your head/neck supported when possible
• Use gentle heat (or ice if it feels better) for comfort
• Try slow, gentle range-of-motion only if it doesn’t worsen pain
• Consider relaxation breathing and shoulder/upper-back stretching if safe

Follow-up questions:
• When did the neck pain start, and did anything trigger it (workout, awkward sleep, long screen time)?
• Do you have numbness/tingling in the arms, severe weakness, or severe worsening pain?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'stomach pain',
      technique: 'symptom_stomach_pain',
      goal: 'Clarify stomach pain and next safe steps',
      match: () =>
        /\b(stomach pain|stomachache|stomach ache|abdominal pain|tummy pain|tummyache|belly pain|bellyache|lower abdominal pain|cramp)\b/.test(normalized) ||
        normalized.includes('stomach') && (normalized.includes('pain') || normalized.includes('ache') || normalized.includes('ache')),
      build: () =>
        `I'm sorry you're dealing with stomach pain — abdominal discomfort can be stressful.

Possible causes might include:
• Indigestion, gas, or irritation from diet (general possibilities)
• Viral illness or mild gastrointestinal upset
• Stress affecting digestion
• Constipation or dehydration
• Food-related causes or medication/supplement effects (general possibilities)

Self-care steps you can try now:
• Sip water or an oral rehydration drink if you can tolerate it
• Stick to bland foods if you’re hungry (e.g., toast, rice, bananas) and avoid heavy/spicy foods
• Consider rest, gentle movement, and heat to the abdomen for comfort
• Avoid alcohol and large meals temporarily

Follow-up questions:
• Where exactly is the pain (upper/lower, center/one side), and when did it start?
• Do you have fever, vomiting, blood in stool, or worsening/severe pain?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'fever',
      technique: 'symptom_fever',
      goal: 'Clarify fever and safe care',
      match: () => /\b(fever|temperature|high temperature|pyrexia)\b/.test(normalized),
      build: () =>
        `I'm sorry you’re feeling unwell — a fever can happen with many illnesses.

Possible causes might include:
• Your body fighting an infection (general possibility)
• A viral illness or bacterial infection
• Dehydration or inflammation-related illness

Self-care steps you can try now:
• Stay hydrated (small sips frequently)
• Rest and monitor symptoms
• Keep the room comfortably cool (avoid extreme cooling)
• Consider checking your temperature if you haven’t already

Follow-up questions:
• What is your temperature (if known), and how long has the fever been present?
• Any concerning symptoms like trouble breathing, severe headache, stiff neck, confusion, persistent vomiting, or a new rash?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'cough',
      technique: 'symptom_cough',
      goal: 'Clarify cough and safe care',
      match: () => /\b(cough|coughing)\b/.test(normalized),
      build: () =>
        `I’m sorry you’re dealing with a cough — that can disrupt sleep and daily life.

Possible causes might include:
• Common cold/viral respiratory irritation (general possibility)
• Allergy-related irritation or post-nasal drip
• Asthma/airway irritation
• Acid reflux irritating the throat
• Infection (general possibility)

Self-care steps you can try now:
• Stay hydrated (warm fluids often feel soothing)
• Consider honey if you’re an adult (if appropriate for you)
• Use gentle steam or humidified air if it helps
• Rest and avoid smoke/irritants

Follow-up questions:
• How long have you had the cough, and is it dry or bringing up mucus?
• Any fever, shortness of breath, chest pain, or coughing blood?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'anxiety',
      technique: 'symptom_anxiety',
      goal: 'Support anxiety and safe coping',
      match: () => /\b(anxiety|anxious|panic|panicking|worried|worry|overthinking)\b/.test(normalized),
      build: () =>
        `It sounds like you’re feeling anxious — that can be very uncomfortable and hard to quiet.

Possible causes might include:
• Racing thoughts and uncertainty
• Stress overload or poor sleep
• Caffeine/stimulants or dehydration
• Feeling pressured by work/school or relationships
• Ongoing worry spirals (general possibility)

Self-care steps you can try now:
• Try grounding: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste
• Do box breathing (in 4, hold 4, out 4, hold 4) for a few rounds
• Slow your pace: drink water and take a short break from screens if possible

Follow-up questions:
• What’s the main worry or thought that keeps coming up?
• On a scale of 1–10, how intense is your anxiety right now?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'stress',
      technique: 'symptom_stress',
      goal: 'Help with stress management',
      match: () => /\b(stress|stressed|overwhelmed|burnout|pressure|tense|tension)\b/.test(normalized),
      build: () =>
        `It makes sense you’d feel stressed — when pressure builds up, it can show up in your body and mind.

Possible causes might include:
• Too much workload or unrealistic expectations
• Not enough recovery time (sleep, breaks, relaxation)
• Disrupted routines and stress eating
• Caffeine, dehydration, or irregular meals
• Negative self-talk and rumination (general possibilities)

Self-care steps you can try now:
• Take a 5–10 minute break: move your body gently or step outside briefly
• Practice slow breathing (e.g., exhale longer than inhale) for a few minutes
• Drink water and eat something light if you haven’t
• Do one small “next step” task to reduce mental load

Follow-up questions:
• What is the biggest source of stress right now (work/school, relationships, health, money, other)?
• How is it showing up most: thoughts, emotions, or physical sensations?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'depression',
      technique: 'symptom_depression',
      goal: 'Support low mood and clarify next steps',
      match: () => /\b(depression|depressed|sad|low mood|unhappy|crying|hopeless)\b/.test(normalized),
      build: () =>
        `I’m really sorry you’re feeling low — that can be heavy and draining.

Possible causes might include:
• Accumulated stress or burnout
• Changes in sleep, appetite, or routine
• Social isolation or feeling disconnected
• Persistent negative thought patterns
• Life transitions or difficult events (general possibilities)

Self-care steps you can try now:
• Be gentle with yourself—small routines count (food, water, rest)
• Get a little light/movement if possible (even a short walk)
• Reach out to someone you trust, even briefly

Follow-up questions:
• How long have you been feeling this way?
• Do you still have any moments of relief, or is it constant?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
    {
      key: 'insomnia',
      technique: 'symptom_insomnia',
      goal: 'Support sleep and clarify next steps',
      match: () => /\b(insomnia|can't sleep|cant sleep|cannot sleep|trouble sleeping|sleep deprived|restless nights|awake at night)\b/.test(normalized),
      build: () =>
        `I’m sorry you’re not getting the sleep you need — insomnia can be exhausting.

Possible causes might include:
• Racing thoughts or anxiety when you try to rest
• Stress and irregular schedules
• Screen time close to bedtime
• Caffeine/stimulants or late meals
• Disrupted sleep environment (general possibilities)

Self-care steps you can try tonight:
• Avoid screens for 30–60 minutes before bed if you can
• If you can’t sleep after ~20–30 minutes, try a quiet activity in dim light
• Do a simple relaxation routine (slow breathing or progressive muscle relaxation)
• Keep your room cool/dark and try to keep a consistent wake time

Follow-up questions:
• How long has the sleep problem been going on?
• What keeps you awake most: thoughts/worry, physical discomfort, or something else?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
    },
  ];

  let fallbackMetadata = {
    technique: 'clinical_support_fallback',
    goal: 'Clarify symptoms and support safely',
    model: 'fallback',
    progress: [],
    sentiment: sentiment?.sentiment || 'neutral',
    riskLevel: crisis?.riskLevel || 0,
    requiresEscalation: false,
  };

  if (crisis && crisis.riskLevel >= 7) {
    return {
      content:
        "I'm concerned by what you've shared. If you are in immediate danger, please contact local emergency services right away or call a crisis hotline. You do not have to handle this alone.",
      metadata: {
        ...fallbackMetadata,
        technique: 'crisis_intervention',
        goal: 'Ensure safety',
        sentiment: sentiment?.sentiment || 'negative',
        riskLevel: crisis.riskLevel,
        requiresEscalation: true,
      },
    };
  }

  for (const matcher of symptomMatchers) {
    if (matcher.match()) {
      return {
        content: matcher.build(),
        metadata: {
          ...fallbackMetadata,
          technique: matcher.technique,
          goal: matcher.goal,
          model: 'fallback',
          requiresEscalation: false,
        },
      };
    }
  }

  // Non-specific emotional fallback (only when no symptom matched)
  if (sentiment && sentiment.sentiment === 'negative') {
    return {
      content: `I hear that you're having a difficult time, and it is important to acknowledge that.

• It can help to describe what you're feeling, when it started, and what makes it feel worse or better.

Please tell me:
• What emotion feels strongest right now?
• Has anything changed recently that may be contributing to this feeling?

I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`,
      metadata: {
        ...fallbackMetadata,
        technique: 'empathetic_validation',
        goal: 'Validate emotion and clarify next steps',
        sentiment: 'negative',
        requiresEscalation: false,
      },
    };
  }

  // Generic fallback only when nothing matched
  return {
    content: `I understand you are sharing a concern. I am not a doctor. This is not medical advice. To help me respond safely, please tell me more about what you're experiencing (and when it started).`,
    metadata: fallbackMetadata,
  };
}


module.exports = {
  generateAIResponse,
};
