"""
Sentiment analysis model.
Uses transformers (distilbert) when available, falls back to VADER + rule-based.
"""

import logging
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

# ─── Try loading transformer model ───────────────────────────────────────────

_pipeline = None

def _load_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    try:
        from transformers import pipeline
        _pipeline = pipeline(
            "text-classification",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            top_k=None,
        )
        logger.info("Loaded DistilBERT sentiment model")
    except Exception as e:
        logger.warning(f"Could not load transformer model: {e}. Using rule-based fallback.")
        _pipeline = None
    return _pipeline


# ─── VADER fallback ───────────────────────────────────────────────────────────

def _vader_sentiment(text: str) -> Dict[str, Any]:
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]

        if compound >= 0.05:
            sentiment = "positive"
        elif compound <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "score": round((compound + 1) / 2, 3),  # normalize to 0-1
            "compound": compound,
            "emotions": {
                "positive": round(scores["pos"], 3),
                "negative": round(scores["neg"], 3),
                "neutral": round(scores["neu"], 3),
            },
            "riskLevel": _estimate_risk(compound),
            "model": "vader",
        }
    except ImportError:
        return _rule_based_sentiment(text)


# ─── Pure rule-based fallback ─────────────────────────────────────────────────

NEGATIVE_WORDS = {
    "sad", "depressed", "anxious", "worried", "scared", "hopeless",
    "worthless", "alone", "tired", "exhausted", "overwhelmed", "angry",
    "frustrated", "hurt", "pain", "crying", "hate", "terrible", "awful",
    "miserable", "desperate", "helpless", "broken", "empty", "numb",
}

POSITIVE_WORDS = {
    "happy", "good", "great", "better", "hopeful", "grateful", "calm",
    "peaceful", "excited", "proud", "loved", "supported", "strong",
    "motivated", "joyful", "content", "relieved", "optimistic",
}

def _rule_based_sentiment(text: str) -> Dict[str, Any]:
    words = set(re.findall(r"\b\w+\b", text.lower()))
    neg = len(words & NEGATIVE_WORDS)
    pos = len(words & POSITIVE_WORDS)
    total = max(neg + pos, 1)

    score = pos / total
    if neg > pos:
        sentiment = "very_negative" if neg >= 3 else "negative"
    elif pos > neg:
        sentiment = "positive"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "score": round(score, 3),
        "emotions": {"positive": pos, "negative": neg},
        "riskLevel": min(neg * 2, 8),
        "model": "rule_based",
    }


def _estimate_risk(compound: float) -> int:
    """Map VADER compound score to a 0-10 risk level."""
    if compound < -0.7:
        return 7
    elif compound < -0.5:
        return 5
    elif compound < -0.3:
        return 3
    elif compound < -0.1:
        return 1
    return 0


# ─── Public API ───────────────────────────────────────────────────────────────

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of text.
    Tries transformer → VADER → rule-based in order.
    """
    pipe = _load_pipeline()

    if pipe is not None:
        try:
            results = pipe(text[:512])[0]  # truncate to model max
            label_scores = {r["label"]: r["score"] for r in results}
            pos_score = label_scores.get("POSITIVE", 0.5)
            neg_score = label_scores.get("NEGATIVE", 0.5)

            sentiment = "positive" if pos_score > neg_score else "negative"
            if abs(pos_score - neg_score) < 0.15:
                sentiment = "neutral"

            return {
                "sentiment": sentiment,
                "score": round(pos_score, 3),
                "emotions": {"positive": round(pos_score, 3), "negative": round(neg_score, 3)},
                "riskLevel": _estimate_risk(neg_score - pos_score),
                "model": "distilbert",
            }
        except Exception as e:
            logger.warning(f"Transformer inference failed: {e}")

    return _vader_sentiment(text)
