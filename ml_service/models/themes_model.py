"""
Theme extraction model.
Identifies recurring topics and emotional themes in therapy conversations.
"""

import re
import logging
from typing import Dict, Any, List
from collections import Counter

logger = logging.getLogger(__name__)

# ─── Theme Definitions ────────────────────────────────────────────────────────

THEME_KEYWORDS = {
    "anxiety": ["anxious", "anxiety", "worry", "worried", "nervous", "panic", "fear", "scared", "dread"],
    "depression": ["depressed", "depression", "sad", "hopeless", "empty", "numb", "worthless", "low"],
    "relationships": ["relationship", "partner", "family", "friend", "lonely", "alone", "social", "connection"],
    "work_stress": ["work", "job", "career", "boss", "colleague", "deadline", "burnout", "pressure"],
    "sleep": ["sleep", "insomnia", "tired", "exhausted", "fatigue", "rest", "nightmare"],
    "self_esteem": ["confidence", "self-worth", "worthless", "failure", "inadequate", "shame", "guilt"],
    "grief": ["loss", "grief", "death", "died", "miss", "mourning", "bereavement"],
    "trauma": ["trauma", "ptsd", "flashback", "abuse", "assault", "past", "childhood"],
    "anger": ["angry", "anger", "rage", "furious", "irritated", "frustrated", "resentment"],
    "motivation": ["motivation", "goals", "purpose", "meaning", "direction", "stuck", "procrastination"],
    "physical_health": ["pain", "illness", "chronic", "body", "health", "medication", "diagnosis"],
    "mindfulness": ["mindfulness", "meditation", "breathing", "present", "awareness", "calm"],
}

# ─── Try KeyBERT for keyword extraction ──────────────────────────────────────

_keybert = None

def _load_keybert():
    global _keybert
    if _keybert is not None:
        return _keybert
    try:
        from keybert import KeyBERT
        _keybert = KeyBERT()
        logger.info("Loaded KeyBERT model")
    except Exception as e:
        logger.warning(f"KeyBERT not available: {e}")
        _keybert = None
    return _keybert


def _extract_keywords_ml(text: str) -> List[str]:
    kb = _load_keybert()
    if kb is None:
        return []
    try:
        keywords = kb.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            top_n=10,
        )
        return [kw[0] for kw in keywords]
    except Exception as e:
        logger.warning(f"KeyBERT extraction failed: {e}")
        return []


def _extract_keywords_rule(text: str) -> List[str]:
    """Simple frequency-based keyword extraction."""
    # Remove common stop words
    stop_words = {
        "i", "me", "my", "myself", "we", "our", "you", "your", "he", "she",
        "it", "they", "what", "which", "who", "this", "that", "these", "those",
        "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
        "had", "do", "does", "did", "will", "would", "could", "should", "may",
        "might", "must", "can", "a", "an", "the", "and", "but", "or", "nor",
        "for", "yet", "so", "at", "by", "in", "of", "on", "to", "up", "as",
        "into", "through", "during", "before", "after", "with", "about", "just",
        "feel", "feeling", "felt", "think", "know", "want", "need", "like",
        "really", "very", "much", "more", "also", "get", "got", "going",
    }
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    filtered = [w for w in words if w not in stop_words]
    counter = Counter(filtered)
    return [word for word, _ in counter.most_common(10)]


# ─── Public API ───────────────────────────────────────────────────────────────

def extract_themes(messages: List[str]) -> Dict[str, Any]:
    """
    Extract themes and keywords from a list of message strings.
    """
    combined_text = " ".join(messages)

    # Detect themes via keyword matching
    detected_themes = []
    for theme, keywords in THEME_KEYWORDS.items():
        lower = combined_text.lower()
        matches = sum(1 for kw in keywords if kw in lower)
        if matches >= 2:
            detected_themes.append((theme, matches))

    # Sort by frequency
    detected_themes.sort(key=lambda x: x[1], reverse=True)
    top_themes = [t[0] for t in detected_themes[:5]]

    # Extract keywords
    ml_keywords = _extract_keywords_ml(combined_text[:1000])
    rule_keywords = _extract_keywords_rule(combined_text)

    # Merge and deduplicate
    all_keywords = list(dict.fromkeys(ml_keywords + rule_keywords))[:15]

    # Generate a simple summary
    summary = ""
    if top_themes:
        summary = f"Main themes: {', '.join(top_themes[:3])}."
        if all_keywords[:3]:
            summary += f" Key topics: {', '.join(all_keywords[:3])}."

    return {
        "themes": top_themes,
        "keywords": all_keywords,
        "summary": summary,
        "themeScores": {t: s for t, s in detected_themes},
    }
