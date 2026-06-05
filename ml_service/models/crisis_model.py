"""
Crisis detection model.
Detects suicidal ideation, self-harm signals, and other high-risk content.
"""

import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# ─── Crisis Keyword Sets ──────────────────────────────────────────────────────

# Tier 1 — Immediate danger (riskLevel 8-10)
TIER1_PHRASES = [
    r"\bsuicid\w*\b",
    r"\bkill\s+myself\b",
    r"\bend\s+my\s+life\b",
    r"\bwant\s+to\s+die\b",
    r"\bdon'?t\s+want\s+to\s+(live|be\s+alive)\b",
    r"\btake\s+my\s+(own\s+)?life\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bself.?harm\b",
    r"\bcutting\s+myself\b",
    r"\boverdos\w*\b",
]

# Tier 2 — High risk (riskLevel 5-7)
TIER2_PHRASES = [
    r"\bhopeless\b",
    r"\bworthless\b",
    r"\bcan'?t\s+go\s+on\b",
    r"\bgive\s+up\b",
    r"\bno\s+point\b",
    r"\bnobody\s+cares\b",
    r"\bburden\b",
    r"\bdisappear\b",
    r"\bcan'?t\s+take\s+it\b",
    r"\bfall\s+apart\b",
]

# Tier 3 — Moderate concern (riskLevel 2-4)
TIER3_PHRASES = [
    r"\bstruggling\b",
    r"\bcan'?t\s+cope\b",
    r"\boverwhelmed\b",
    r"\bbreaking\s+down\b",
    r"\bfalling\s+apart\b",
    r"\bexhausted\b",
    r"\bnumb\b",
    r"\bempty\b",
]

# Negation patterns — reduce risk if present
NEGATION_PATTERNS = [
    r"\bnot\s+suicid\w*\b",
    r"\bnever\s+thought\s+about\b",
    r"\bdon'?t\s+want\s+to\s+hurt\b",
    r"\bused\s+to\s+feel\b",
    r"\bin\s+the\s+past\b",
]


def _compile_patterns(phrases: List[str]):
    return [re.compile(p, re.IGNORECASE) for p in phrases]


_tier1 = _compile_patterns(TIER1_PHRASES)
_tier2 = _compile_patterns(TIER2_PHRASES)
_tier3 = _compile_patterns(TIER3_PHRASES)
_negations = _compile_patterns(NEGATION_PATTERNS)


# ─── Try ML model (zero-shot classification) ─────────────────────────────────

_classifier = None

def _load_classifier():
    global _classifier
    if _classifier is not None:
        return _classifier
    try:
        from transformers import pipeline
        _classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
        )
        logger.info("Loaded zero-shot crisis classifier")
    except Exception as e:
        logger.warning(f"Could not load zero-shot model: {e}")
        _classifier = None
    return _classifier


def _ml_crisis_score(text: str) -> float:
    """Returns a 0-1 crisis probability using zero-shot classification."""
    clf = _load_classifier()
    if clf is None:
        return -1.0
    try:
        result = clf(
            text[:512],
            candidate_labels=["crisis", "distress", "normal"],
            multi_label=False,
        )
        label_scores = dict(zip(result["labels"], result["scores"]))
        return label_scores.get("crisis", 0.0)
    except Exception as e:
        logger.warning(f"Zero-shot inference failed: {e}")
        return -1.0


# ─── Public API ───────────────────────────────────────────────────────────────

def detect_crisis(text: str) -> Dict[str, Any]:
    """
    Detect crisis signals in text.
    Returns riskLevel (0-10), flags, and requiresIntervention.
    """
    flags: List[str] = []
    risk_level = 0

    # Check negations first
    has_negation = any(p.search(text) for p in _negations)

    # Tier 1 matches
    for i, pattern in enumerate(_tier1):
        if pattern.search(text):
            flag = TIER1_PHRASES[i].replace(r"\b", "").replace(r"\w*", "").replace("\\", "")
            flags.append(flag.strip())
            risk_level = max(risk_level, 9 if not has_negation else 4)

    # Tier 2 matches
    for i, pattern in enumerate(_tier2):
        if pattern.search(text):
            flag = TIER2_PHRASES[i].replace(r"\b", "").replace("\\", "")
            flags.append(flag.strip())
            risk_level = max(risk_level, 6 if not has_negation else 2)

    # Tier 3 matches
    for i, pattern in enumerate(_tier3):
        if pattern.search(text):
            risk_level = max(risk_level, 3 if not has_negation else 1)

    # Boost with ML model if available
    ml_score = _ml_crisis_score(text)
    if ml_score >= 0:
        ml_risk = int(ml_score * 10)
        risk_level = max(risk_level, ml_risk)

    # Cap at 10
    risk_level = min(risk_level, 10)

    return {
        "riskLevel": risk_level,
        "flags": list(set(flags)),
        "requiresIntervention": risk_level >= 7,
        "hasNegation": has_negation,
        "mlScore": round(ml_score, 3) if ml_score >= 0 else None,
    }
