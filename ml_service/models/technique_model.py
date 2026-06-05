"""
Therapy technique recommendation model.
Maps emotional context to evidence-based therapeutic approaches.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# ─── Technique Definitions ────────────────────────────────────────────────────

TECHNIQUES = {
    "CBT": {
        "name": "Cognitive Behavioral Therapy",
        "description": "Identify and reframe negative thought patterns",
        "triggers": ["negative thoughts", "catastrophizing", "self-blame", "rumination", "worry"],
        "emotions": ["anxious", "depressed", "angry", "frustrated"],
    },
    "DBT": {
        "name": "Dialectical Behavior Therapy",
        "description": "Emotion regulation and distress tolerance skills",
        "triggers": ["emotional dysregulation", "impulsive", "intense emotions", "relationships"],
        "emotions": ["overwhelmed", "borderline", "intense"],
    },
    "mindfulness": {
        "name": "Mindfulness-Based Therapy",
        "description": "Present-moment awareness and acceptance",
        "triggers": ["stress", "anxiety", "overthinking", "racing thoughts", "can't focus"],
        "emotions": ["anxious", "stressed", "overwhelmed", "scattered"],
    },
    "breathing_exercise": {
        "name": "Breathing Exercise",
        "description": "Regulated breathing to activate the parasympathetic nervous system",
        "triggers": ["panic", "anxiety", "stress", "overwhelmed", "tense"],
        "emotions": ["anxious", "panicked", "stressed"],
    },
    "behavioral_activation": {
        "name": "Behavioral Activation",
        "description": "Increase engagement with positive activities to improve mood",
        "triggers": ["depression", "withdrawal", "isolation", "no motivation", "hopeless"],
        "emotions": ["depressed", "hopeless", "withdrawn"],
    },
    "motivational_interviewing": {
        "name": "Motivational Interviewing",
        "description": "Explore ambivalence and strengthen motivation for change",
        "triggers": ["change", "motivation", "goals", "stuck", "ambivalent"],
        "emotions": ["ambivalent", "unmotivated", "stuck"],
    },
    "supportive_listening": {
        "name": "Supportive Listening",
        "description": "Empathetic presence and validation",
        "triggers": ["need to talk", "feeling heard", "support", "lonely"],
        "emotions": ["sad", "lonely", "neutral", "grieving"],
    },
    "grounding": {
        "name": "Grounding Technique",
        "description": "5-4-3-2-1 sensory grounding to reduce dissociation and panic",
        "triggers": ["dissociation", "panic attack", "flashback", "unreal", "detached"],
        "emotions": ["panicked", "dissociated", "traumatized"],
    },
    "problem_solving": {
        "name": "Problem-Solving Therapy",
        "description": "Structured approach to identify and solve life problems",
        "triggers": ["problem", "decision", "stuck", "don't know what to do", "options"],
        "emotions": ["confused", "stuck", "overwhelmed"],
    },
}

# ─── Keyword → Technique Mapping ─────────────────────────────────────────────

KEYWORD_MAP = {
    "panic": "breathing_exercise",
    "anxiety": "breathing_exercise",
    "anxious": "CBT",
    "worry": "CBT",
    "negative thoughts": "CBT",
    "depressed": "behavioral_activation",
    "hopeless": "behavioral_activation",
    "no motivation": "behavioral_activation",
    "overwhelmed": "mindfulness",
    "stress": "mindfulness",
    "mindfulness": "mindfulness",
    "motivation": "motivational_interviewing",
    "change": "motivational_interviewing",
    "goals": "motivational_interviewing",
    "lonely": "supportive_listening",
    "need to talk": "supportive_listening",
    "dissociation": "grounding",
    "flashback": "grounding",
    "problem": "problem_solving",
    "decision": "problem_solving",
    "intense emotions": "DBT",
    "relationships": "DBT",
}


def recommend_technique(
    messages: List[Dict[str, str]],
    current_emotion: str = "neutral",
) -> Dict[str, Any]:
    """
    Recommend a therapy technique based on conversation context.
    """
    # Combine recent messages into a single text for analysis
    recent_text = " ".join(
        m.get("content", "") for m in messages[-6:] if m.get("role") == "user"
    ).lower()

    scores: Dict[str, float] = {t: 0.0 for t in TECHNIQUES}

    # Score based on keyword matches
    for keyword, technique in KEYWORD_MAP.items():
        if keyword in recent_text:
            scores[technique] = scores.get(technique, 0) + 1.0

    # Score based on emotion match
    for technique, info in TECHNIQUES.items():
        if current_emotion in info["emotions"]:
            scores[technique] = scores.get(technique, 0) + 0.5

    # Pick highest scoring technique
    best = max(scores, key=lambda t: scores[t])
    best_score = scores[best]

    # Default to supportive listening if no strong signal
    if best_score < 0.5:
        best = "supportive_listening"
        confidence = 0.6
    else:
        confidence = min(0.95, 0.6 + best_score * 0.1)

    technique_info = TECHNIQUES[best]

    return {
        "technique": best,
        "name": technique_info["name"],
        "description": technique_info["description"],
        "confidence": round(confidence, 2),
        "rationale": f"Based on detected themes: {', '.join(technique_info['triggers'][:3])}",
        "allScores": {k: round(v, 2) for k, v in scores.items() if v > 0},
    }
