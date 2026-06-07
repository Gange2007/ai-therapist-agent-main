// Uses Gemini REST API directly — avoids SDK version/model-name issues.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Aura, a clinically-oriented companion who communicates clearly, concisely, and with a safety-first approach.

PRINCIPLES (required):
1. Use a concise, clinician-style tone: precise, neutral, and empathetic.
2. NEVER provide a medical diagnosis. Present possible causes only as general possibilities and explicitly include the disclaimer: "I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional."
3. Prioritize safety: when red-flag symptoms appear (sudden severe pain, difficulty breathing, fainting, change in consciousness, signs of stroke, suicidal intent), instruct the user to seek emergency care immediately.

STRUCTURED RESPONSE (when symptoms are reported):
- A short acknowledgement sentence.
- A concise list (•) of plausible, high-level causes (up to 4), labeled as possibilities.
- A concise list (•) of safe, non-invasive self-care steps the user can try immediately (avoid medication or procedural advice).
- 2 focused clinician-style follow-up questions to clarify onset, severity, and red flags (e.g., "When did this start?", "On a scale of 1-10, how severe is the pain?").
- If concern persists or red flags exist, recommend seeing a clinician and provide local emergency guidance when possible.

CRISIS PROTOCOL: If the user expresses self-harm or imminent danger, respond with direct safety instructions and encourage immediate contact with local emergency services or crisis hotlines.

Tone: clinical, concise, empathetic, and safety-first.`;

export type GeminiHistoryEntry = {

  role: "user" | "model";
  parts: { text: string }[];
};

export async function generateGeminiResponse(
  message: string,
  history: GeminiHistoryEntry[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env.local or environment.");
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
  const msg = (message || "").toLowerCase();
  const disclaimer = `I am not a doctor. This is not medical advice. If you are concerned, please consult a healthcare professional.`;

  // Symptom templates (acknowledge, possible causes, self-care, 2 follow-up questions, disclaimer)
  // NOTE: This local fallback only runs when the Gemini API call fails.

  const has = (re: RegExp) => re.test(msg);

  const followUp = {
    painLevel: `• On a scale of 1–10, how severe is it right now?`,
    whenStarted: `• When did it start?`,
    swelling: `• Any swelling, warmth, or visible changes?`,
    injury: `• Any recent injury, fall, twist, or new activity?`,
    tempKnown: `• What is your temperature (if you’ve checked), and for how long?`,
    breathing: `• Any trouble breathing or chest pain?`,
    mucus: `• Is the cough dry or bringing up mucus?`,
    severityFever: `• Is the fever persistent or getting worse?`,
    primaryWorry: `• What’s the main worry or thought that keeps coming up?`,
    duration: `• How long has this been going on?`,
    sleepTrouble: `• How many nights has the sleep problem been happening?`,
  };

  if (has(/\b(headache|migraine|head pain|head hurt)\b/) || (msg.includes("head") && (msg.includes("ache") || msg.includes("hurt")))) {
    return `I'm sorry you're dealing with a headache — that can be really draining.

Possible causes might include:
• Dehydration or not eating enough
• Stress/tension or poor posture
• Lack of sleep or irregular sleep
• Eye strain (screens/bright light)
• Recent illness/sinus irritation (general possibilities)

Self-care steps you can try now:
• Drink water (and eat something light if you haven't)
• Step away from screens for a short break
• Try gentle neck/shoulder relaxation or slow breathing
• Rest in a dim/quiet space

Follow-up questions:
${followUp.whenStarted}
${followUp.painLevel}

${disclaimer}`;
  }


  if (/\b(knee pain|knee hurt|pain in my knee|aching knee)\b/.test(msg)) {
    return `I'm sorry you're dealing with knee pain — it can make everyday movement frustrating.

Possible causes might include:
• Overuse/strain from activity
• A minor injury (twist/impact/sprain)
• Inflammation of tissues around the knee
• Wear-and-tear/arthritis-like changes (general possibility)
• Muscle imbalance or altered mechanics

Self-care steps you can try now:
• Rest the knee and avoid painful movements for 24–48 hours
• Ice for 15–20 minutes at a time after activity (if it helps)
• Gentle compression/support if comfortable (avoid restricting circulation)
• Support with comfortable footwear and avoid overloading it

Follow-up questions:
• When did it start, and was there an injury or workout beforehand?
• Any swelling/warmth, and can you put weight on it normally?

${disclaimer}`;
  }

  if (/\b(back pain|lower back pain|lumbar pain|spine pain)\b/.test(msg)) {
    return `I'm sorry you're experiencing back pain — it can make sitting and moving harder.

Possible causes might include:
• Muscle strain or ligament irritation
• Poor posture or prolonged sitting
• Lifting/bending/twisting overuse
• Stress-related muscle tension
• Irritation of spine/back structures (general possibilities)

Self-care steps you can try now:
• Take it easier for 24–48 hours and avoid movements that sharply worsen pain
• Use gentle heat or ice for comfort (whichever feels better)
• Try light movement/short walks if they don't worsen symptoms
• Gentle stretching only if it feels safe

Follow-up questions:
• Where exactly is the pain (low vs mid back), and did it start after lifting/sudden movement?
• Any pain spreading down a leg, numbness/tingling, or trouble controlling bladder/bowel?

${disclaimer}`;
  }

  if (/\b(neck pain|sore neck|cervical pain|pain in my neck)\b/.test(msg)) {
    return `I'm sorry your neck is hurting — neck pain can be stubborn and distracting.

Possible causes might include:
• Muscle strain from posture or sleep position
• Stress-related tension
• Prolonged screen use
• Minor overuse/sprain (general possibility)
• Irritation after a recent movement/activity

Self-care steps you can try now:
• Take screen breaks and keep your neck supported if possible
• Use gentle heat (or ice if it feels better) for comfort
• Do slow, gentle range-of-motion only if it doesn't worsen pain
• Try relaxing breathing and gentle shoulder/upper-back stretching if safe

Follow-up questions:
• When did the neck pain start, and did anything trigger it (workout/awkward sleep/long screen time)?
• Any numbness/tingling in the arms, severe weakness, or rapidly worsening pain?

${disclaimer}`;
  }

  if (/\b(stomach pain|stomachache|stomach ache|abdominal pain|tummy pain|tummyache|belly pain|cramp|bellyache)\b/.test(msg)) {
    return `I'm sorry you're dealing with stomach pain — that can be uncomfortable.

Possible causes might include:
• Indigestion, gas, or diet-related irritation (general possibilities)
• Viral illness or mild GI upset
• Stress affecting digestion
• Constipation/dehydration
• Food-related causes (and sometimes medication/supplement effects)

Self-care steps you can try now:
• Sip water or an oral rehydration drink if you can tolerate it
• Stick to bland foods if you're hungry (toast/rice/bananas) and avoid heavy/spicy foods
• Rest and use gentle heat to the abdomen for comfort
• Avoid alcohol and large meals temporarily

Follow-up questions:
• Where exactly is the pain (upper/lower, center/one side), and when did it start?
• Any fever, vomiting, blood in stool, or worsening/severe pain?

${disclaimer}`;
  }

  if (/\b(fever|temperature|high temperature|pyrexia)\b/.test(msg)) {
    return `I'm sorry you're feeling unwell — fever can happen with many different illnesses.

Possible causes might include:
• Your body fighting an infection (general possibility)
• Viral or bacterial infection
• Dehydration or inflammation-related illness

Self-care steps you can try now:
• Stay hydrated with small sips frequently
• Rest and monitor symptoms
• Keep the room comfortably cool
• If you can, check your temperature

Follow-up questions:
• What is your temperature (if known), and how long has the fever been present?
• Any concerning symptoms like trouble breathing, severe headache, stiff neck, confusion, persistent vomiting, or a new rash?

${disclaimer}`;
  }

  if (/\b(cough|coughing)\b/.test(msg)) {
    return `I'm sorry you're dealing with a cough — that can disrupt sleep and daily life.

Possible causes might include:
• Common cold/viral respiratory irritation (general possibility)
• Allergy-related irritation or post-nasal drip
• Airway irritation/asthma-like inflammation
• Acid reflux irritating the throat
• Infection (general possibility)

Self-care steps you can try now:
• Stay hydrated (warm fluids often feel soothing)
• Consider honey if you're an adult (if appropriate)
• Use gentle steam/humidified air if it helps
• Rest and avoid smoke/irritants

Follow-up questions:
• How long have you had the cough, and is it dry or with mucus?
• Any fever, shortness of breath, chest pain, or coughing blood?

${disclaimer}`;
  }

  if (/\b(anxiety|anxious|panic|panicking|worried|worry|overthinking)\b/.test(msg)) {
    return `It sounds like you're feeling anxious — that can be intense and hard to quiet.

Possible causes might include:
• Racing thoughts about uncertainty
• Stress overload or poor sleep
• Caffeine/stimulants, dehydration, or overstimulation
• Worry spirals (general possibilities)

Self-care steps you can try now:
• Grounding: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste
• Box breathing (in 4, hold 4, out 4, hold 4) for a few rounds
• Slow your pace and take a short break from screens

Follow-up questions:
• What’s the main worry or thought that keeps coming up?
• On a scale of 1–10, how intense is your anxiety right now?

${disclaimer}`;
  }

  if (/\b(stress|stressed|overwhelmed|burnout|pressure|tense|tension)\b/.test(msg)) {
    return `It makes sense you’d feel stressed — pressure can build in both your mind and body.

Possible causes might include:
• Too much workload or high expectations
• Not enough recovery time (sleep, breaks, relaxation)
• Disrupted routines and stress eating
• Caffeine/dehydration/irregular meals
• Negative self-talk and rumination (general possibilities)

Self-care steps you can try now:
• Take a 5–10 minute break (step outside briefly or move gently)
• Try slow breathing (exhale longer than inhale)
• Drink water and eat something light if you haven't
• Do one small next step to reduce mental load

Follow-up questions:
• What is the biggest source of stress right now (work/school, relationships, health, money, other)?
• How is it showing up most: thoughts, emotions, or physical sensations?

${disclaimer}`;
  }

  if (/\b(depression|depressed|sad|low mood|unhappy|crying|hopeless)\b/.test(msg)) {
    return `I'm really sorry you're feeling low — that can be heavy and draining.

Possible causes might include:
• Accumulated stress or burnout
• Changes in sleep, appetite, or routine
• Social isolation or feeling disconnected
• Persistent negative thought patterns
• Life transitions or difficult events (general possibilities)

Self-care steps you can try now:
• Be gentle with yourself—small routines count (food, water, rest)
• Get a little light/movement if possible (even a short walk)
• Reach out to someone you trust briefly if you can

Follow-up questions:
• How long have you been feeling this way?
• Do you still have any moments of relief, or does it feel constant?

${disclaimer}`;
  }

  if (/\b(insomnia|can't sleep|cant sleep|cannot sleep|trouble sleeping|sleep deprived|restless nights|awake at night)\b/.test(msg)) {
    return `I'm sorry you're not getting the sleep you need — insomnia can be exhausting.

Possible causes might include:
• Racing thoughts/anxiety when you try to rest
• Stress and irregular schedules
• Screen time close to bedtime
• Caffeine/stimulants or late meals
• A disrupted sleep environment (general possibilities)

Self-care steps you can try tonight:
• Avoid screens 30–60 minutes before bed if possible
• If you can't sleep after ~20–30 minutes, try a quiet activity in dim light
• Try relaxation (slow breathing or progressive muscle relaxation)
• Keep your room cool/dark and keep a consistent wake time

Follow-up questions:
• How long has this sleep problem been going on?
• What keeps you awake most: worry/thoughts, or physical discomfort?

${disclaimer}`;
  }

  // Default greeting / general talk
  return `I'm here to listen and support you. Whether you're dealing with stress, physical symptoms, or just need someone to talk to, feel free to share what's on your mind.`;
}

