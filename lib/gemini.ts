// Uses Gemini REST API directly — avoids SDK version/model-name issues.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Aura, a warm, intelligent, and context-aware AI therapist companion. You think like a real therapist — connecting dots across the conversation and responding with genuine insight rather than generic comfort.

## CORE BEHAVIOUR

1. Connect context across messages. If the user mentions a physical symptom (headache, fatigue, insomnia) and later mentions a stressor (exams, work, relationships), always link them explicitly.

2. Never give only generic empathetic responses. Always pair emotional validation with specific, useful information.

3. Track the full conversation. Reference earlier messages to make responses feel continuous and personalised.

4. Maintain a warm, conversational therapist tone. Sound like a caring, knowledgeable person — not a chatbot.

## SYMPTOM RESPONSE PROTOCOL

When a user mentions ANY physical or emotional symptom — headache, stress, tiredness, anxiety, lack of sleep, stomach ache, low mood, difficulty concentrating — ALWAYS respond using this exact structure:

1. One warm acknowledgement sentence.
2. A sentence introducing possible causes, followed by a bullet list of 4-5 causes relevant to their symptom.
3. A sentence like "Here are some things that may help:", followed by a bullet list of 4-5 specific self-care suggestions tailored to the symptom.
4. A sentence like "To better understand what you're going through:", followed by a bullet list of 2-3 short diagnostic questions.
5. If the symptom could be medical or persistent, end with: "If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional."

Use actual bullet points (the • character) for all lists. This structure is mandatory for every symptom-related message.

## SYMPTOM REFERENCE GUIDE

Headache — Causes: stress/tension, dehydration, lack of sleep, eye strain from screens, skipped meals, neck/shoulder tension, illness. Self-care: drink water, rest eyes from screens, short break, deep breathing, gentle neck stretches, eat something light.

Stress / Exam tension — Causes: workload pressure, fear of failure, poor sleep, excessive caffeine, no breaks, negative self-talk. Self-care: 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s), 5-min breaks every 45 mins, write down worries, reduce caffeine, short walk.

Tiredness / Fatigue — Causes: poor sleep, overworking, dehydration, poor nutrition, stress, no physical movement. Self-care: prioritise 7-9 hours sleep, 10-20 min nap, drink water, light movement, avoid screens before bed.

Anxiety — Causes: upcoming events, uncertainty, negative thought spirals, caffeine, poor sleep, social pressure. Self-care: 5-4-3-2-1 grounding (5 things you see, 4 hear, 3 touch, 2 smell, 1 taste), box breathing, journalling, limit social media.

Lack of sleep / Insomnia — Causes: racing thoughts, screen use before bed, irregular schedule, stress, late caffeine. Self-care: write a worry list before bed, no screens 30 mins before sleep, progressive muscle relaxation, cool dark room, consistent bedtime.

Low mood / Sadness — Causes: isolation, stress accumulation, lack of sunlight, disrupted routine, negative thought patterns. Self-care: brief outdoor walk, talk to someone you trust, write 3 things you're grateful for, gentle movement, maintain routine.

## CRISIS PROTOCOL

If the user expresses suicidal ideation or self-harm: acknowledge their pain seriously, provide "Please reach out to the 988 Suicide & Crisis Lifeline — call or text 988 (US)", and encourage contacting emergency services.

## FEW-SHOT EXAMPLES

User: "im suffering from headache"

Aura: "I'm sorry you're experiencing a headache — they can really drain your energy and make it hard to focus.

Headaches can sometimes be caused by:
• Stress or tension building up in the body
• Dehydration — even mild dehydration triggers them
• Lack of sleep or poor sleep quality
• Eye strain from prolonged screen use
• Skipping meals or low blood sugar

Here are some things that may help:
• Drink a full glass of water right now
• Step away from your screen for 10-15 minutes
• Try slow deep breaths or gentle neck and shoulder stretches
• Rest in a quiet, dimly lit space if possible
• Eat something light if you haven't had a meal recently

To better understand what you're going through:
• How long have you had this headache?
• Would you describe it as mild, moderate, or severe?
• Have you been under stress or studying for long hours recently?

If the headache is very severe, came on suddenly, or has lasted more than a day, it's worth checking in with a doctor."

---

User: "exam tension" (after mentioning headache)

Aura: "That connection makes a lot of sense — exam stress is one of the most common triggers for tension headaches, and your body is physically absorbing the pressure you're under. The headache you mentioned is very likely your body signalling that it needs relief.

Exam stress is often caused by:
• Fear of failure or high expectations from yourself or others
• Long study sessions without enough breaks
• Poor or disrupted sleep during exam season
• Too much caffeine and not enough water or food
• Negative self-talk and catastrophising thoughts

Here are some things that may help right now:
• Try 4-7-8 breathing: inhale for 4 seconds, hold for 7, exhale for 8 — repeat 3 times
• Take a proper 5-minute break away from your study materials
• Drink water — dehydration makes stress and headaches significantly worse
• Write your biggest exam worry down on paper to get it out of your head
• Schedule short study blocks (45 mins on, 5-10 mins off) rather than marathon sessions

To better understand what you're feeling:
• On a scale of 1-10, how stressed are you feeling right now?
• Are you getting enough sleep, or has studying been cutting into that?
• How much time do you have left before the exam?"

---

User: "i cant sleep"

Aura: "Difficulty sleeping often means your mind is carrying more than it can switch off from — that's a very common response to stress or anxiety.

Trouble sleeping can be caused by:
• Racing or anxious thoughts that activate when you lie down
• Using screens close to bedtime (blue light disrupts melatonin)
• Stress or worry about upcoming events
• An irregular sleep schedule
• Caffeine consumed later in the day

Here are some things that may help tonight:
• Write down everything on your mind before bed — it empties the mental load
• Avoid all screens for at least 30 minutes before sleeping
• Try progressive muscle relaxation: tense and release each muscle group from toes to shoulders
• Keep your room cool and as dark as possible
• Try to go to bed and wake up at the same time every day

To better understand what's happening:
• What does your mind tend to focus on when you're lying awake?
• How many nights has this been going on?
• Is there something specific coming up that's worrying you?"`;

export type GeminiHistoryEntry = {
  role: "user" | "model";
  parts: { text: string }[];
};

export async function generateGeminiResponse(
  message: string,
  history: GeminiHistoryEntry[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("[gemini] GEMINI_API_KEY is not set. Falling back to local responder.");
    return getLocalFallbackResponse(message);
  }

  const contents: { role: string; parts: { text: string }[] }[] = [
    ...history,
    { role: "user", parts: [{ text: message }] },
  ];

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 600,
    },
  };

  console.log(`[gemini] POST ${GEMINI_MODEL} — message: "${message.slice(0, 80)}"`);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json() as any;

    if (!res.ok) {
      const errMsg: string = data?.error?.message || res.statusText;
      console.error(`[gemini] API error ${res.status}: ${errMsg}`);
      console.warn("[gemini] Falling back to local responder.");
      return getLocalFallbackResponse(message);
    }

    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[gemini] Unexpected response shape:", JSON.stringify(data).slice(0, 300));
      return getLocalFallbackResponse(message);
    }

    console.log(`[gemini] Reply received (${text.length} chars)`);
    return text;
  } catch (err: any) {
    console.error(`[gemini] Unexpected fetch error: ${err.message}`);
    console.warn("[gemini] Falling back to local responder.");
    return getLocalFallbackResponse(message);
  }
}

export function getLocalFallbackResponse(message: string): string {
  const msg = message.toLowerCase();

  // 1. Headache
  if (
    msg.includes("headache") ||
    msg.includes("migraine") ||
    msg.includes("head pain") ||
    msg.includes("head hurt")
  ) {
    return `I'm sorry you're experiencing a headache — they can really drain your energy and make it hard to focus.

Headaches can sometimes be caused by:
• Stress or tension building up in the body
• Dehydration — even mild dehydration triggers them
• Lack of sleep or poor sleep quality
• Eye strain from prolonged screen use
• Skipping meals or low blood sugar

Here are some things that may help:
• Drink a full glass of water right now
• Step away from your screen for 10-15 minutes
• Try slow deep breaths or gentle neck and shoulder stretches
• Rest in a quiet, dimly lit space if possible
• Eat something light if you haven't had a meal recently

To better understand what you're going through:
• How long have you had this headache?
• Would you describe it as mild, moderate, or severe?
• Have you been under stress or studying for long hours recently?

If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional.`;
  }

  // 2. Stress / Exam tension
  if (
    msg.includes("stress") ||
    msg.includes("exam") ||
    msg.includes("overwhelmed") ||
    msg.includes("tension") ||
    msg.includes("study") ||
    msg.includes("pressure") ||
    msg.includes("burnout") ||
    msg.includes("stressed") ||
    msg.includes("worry") ||
    msg.includes("worried") ||
    msg.includes("tense") ||
    msg.includes("nervous") ||
    msg.includes("stressed out")
  ) {
    return `It sounds like you're carrying a lot of pressure right now, and stress can be incredibly overwhelming to deal with.

Stress is often caused by:
• Workload pressure or high expectations from yourself or others
• Long study sessions or periods of focus without enough physical breaks
• Disrupted or poor quality sleep during busy periods
• High caffeine consumption and dehydration
• Persistent negative self-talk or worrying about future outcomes

Here are some things that may help right now:
• Try 4-7-8 breathing: inhale for 4 seconds, hold for 7, exhale for 8 — repeat 3 times
• Take a proper 5-10 minute break away from all study and work materials
• Drink water — dehydration makes stress and headaches significantly worse
• Write down your biggest worries on paper to get them out of your head
• Schedule short study blocks (45 mins on, 5-10 mins off) rather than marathon sessions

To better understand what you're feeling:
• On a scale of 1-10, how intense is this stress feeling right now?
• Are you getting enough sleep, or has studying or work been cutting into that?
• How much time do you have left before your exams or deadlines?

If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional.`;
  }

  // 3. Tiredness / Fatigue
  if (
    msg.includes("tired") ||
    msg.includes("fatigue") ||
    msg.includes("exhausted") ||
    msg.includes("sleepy") ||
    msg.includes("weakness") ||
    msg.includes("tiredness") ||
    msg.includes("burnt out") ||
    msg.includes("drained") ||
    msg.includes("low energy") ||
    msg.includes("worn out")
  ) {
    return `Feeling constantly tired or fatigued can make even the simplest tasks feel like a mountain to climb.

Tiredness and fatigue can be caused by:
• Insufficient sleep (less than 7-9 hours) or poor sleep hygiene
• Overworking without giving your body and mind time to recharge
• Dehydration, which directly drains physical energy
• Poor nutrition or irregular meals causing blood sugar crashes
• Unmanaged stress or anxiety running in the background

Here are some things that may help:
• Prioritize getting 7-9 hours of restful sleep tonight
• Consider taking a short, timed 10-20 minute power nap to recharge
• Drink a tall glass of water right now
• Do some light movement, like stretching or a short walk, to boost circulation
• Avoid screens for at least 30-60 minutes before bedtime

To better understand what you're going through:
• How many hours of sleep have you been getting on average?
• Have you been working or studying for long hours without a break?
• Do you notice your energy levels dropping at specific times of the day?

If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional.`;
  }

  // 4. Anxiety / Panic / Worry
  if (
    msg.includes("anxiety") ||
    msg.includes("anxious") ||
    msg.includes("panic") ||
    msg.includes("worry") ||
    msg.includes("worried") ||
    msg.includes("overthinking") ||
    msg.includes("nervous") ||
    msg.includes("restless")
  ) {
    return `Anxiety can feel very intense and physical, and I want to remind you that you are safe in this moment.

Anxiety can be caused by:
• Racing thoughts about upcoming events or uncertainty
• Negative thought patterns or worrying spirals
• Excessive caffeine or lack of physical rest
• Heightened sensitivity to social, study, or work pressures
• Overstimulation from screens and constant information flow

Here are some things that may help:
• Try the 5-4-3-2-1 grounding exercise: notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste
• Practice box breathing: inhale for 4 seconds, hold for 4, exhale for 4, hold for 4
• Write down your anxious thoughts in a journal to release them from your head
• Limit social media usage and news consumption for the rest of the day
• Remind yourself that thoughts are not facts and this feeling will pass

To better understand what you're going through:
• Are you feeling the anxiety mostly in your body (like a fast heart rate or tight chest) or in your mind?
• What is the main worry or thought that seems to be repeating itself right now?
• Have you had experiences with anxiety like this before?

If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional.`;
  }

  // 5. Lack of sleep / Insomnia
  if (
    msg.includes("insomnia") ||
    msg.includes("sleep") ||
    msg.includes("awake") ||
    msg.includes("restless") ||
    msg.includes("can't sleep") ||
    msg.includes("cant sleep") ||
    msg.includes("cannot sleep") ||
    msg.includes("can't fall asleep") ||
    msg.includes("cant fall asleep") ||
    msg.includes("sleep deprived") ||
    msg.includes("restless nights")
  ) {
    return `It can be incredibly frustrating to lie awake when all you want to do is rest and sleep.

Trouble sleeping can be caused by:
• Racing or anxious thoughts that activate when you lie down
• Using screens close to bedtime (blue light disrupts melatonin)
• Stress or worry about upcoming events
• An irregular sleep schedule
• Caffeine consumed later in the day

Here are some things that may help tonight:
• Write down everything on your mind before bed — it empties the mental load
• Avoid all screens for at least 30 minutes before sleeping
• Try progressive muscle relaxation: tense and release each muscle group from toes to shoulders
• Keep your room cool, dark, and quiet
• Try to go to bed and wake up at the same time every day

To better understand what's happening:
• What does your mind tend to focus on when you're lying awake?
• How many nights has this been going on?
• Is there something specific coming up that's worrying you?

If this has been going on for a while or feels severe, it's worth checking in with a doctor or healthcare professional.`;
  }

  // 6. Low mood / Sadness / Depression
  if (msg.includes("sad") || msg.includes("low mood") || msg.includes("depressed") || msg.includes("depression") || msg.includes("crying") || msg.includes("unhappy")) {
    return `Feeling down or experiencing a low mood can make it hard to find motivation or connection with things you normally enjoy.

Low mood and sadness can be caused by:
• Accumulated stress or emotional exhaustion without recovery
• Social isolation or feeling disconnected from others
• Lack of exposure to natural sunlight or disruption of physical routine
• Automatic negative thoughts and self-criticism
• Recent disappointing news or life transitions

Here are some things that may help:
• Take a brief, gentle walk outdoors to get some natural light and fresh air
• Reach out and chat with a trusted friend, family member, or loved one
• Write down three small things you are grateful for today
• Keep to a basic, gentle routine for meals and rest
• Treat yourself with kindness and allow yourself to feel without judgment

To better understand what you're going through:
• Have you been feeling this way for a few days, or has it been going on longer?
• Are there specific areas of your life that feel particularly heavy or draining right now?
• Is there one small activity that usually brings you a bit of comfort?

If your mood remains consistently low for more than two weeks, please reach out to a doctor or mental health professional.`;
  }

  // Default greeting / general talk
  return `I'm here to listen and support you. Whether you're dealing with stress, physical symptoms, or just need someone to talk to, feel free to share what's on your mind. How can I help you today?`;
}
