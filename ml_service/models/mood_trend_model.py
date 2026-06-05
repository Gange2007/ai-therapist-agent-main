"""
Mood trend prediction model.
Uses linear regression to predict mood trajectory from historical data.
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def predict_mood_trend(mood_history: List[Dict]) -> Dict[str, Any]:
    """
    Predict mood trend from historical mood scores.
    
    Args:
        mood_history: List of {"score": int, "timestamp": str} dicts
    
    Returns:
        {"trend": str, "prediction": int, "confidence": float, "slope": float}
    """
    if not mood_history or len(mood_history) < 2:
        return {
            "trend": "insufficient_data",
            "prediction": None,
            "confidence": 0.0,
            "slope": 0.0,
            "message": "Need at least 2 data points for trend analysis",
        }

    scores = [float(m.get("score", 50)) for m in mood_history]
    n = len(scores)

    # Try numpy/scipy for proper linear regression
    try:
        import numpy as np
        x = np.arange(n, dtype=float)
        slope, intercept = np.polyfit(x, scores, 1)
        predicted = float(np.clip(intercept + slope * n, 0, 100))

        # R² for confidence
        y_mean = np.mean(scores)
        ss_tot = np.sum((np.array(scores) - y_mean) ** 2)
        ss_res = np.sum((np.array(scores) - (intercept + slope * x)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        confidence = float(np.clip(abs(r_squared), 0.3, 0.95))

    except ImportError:
        # Pure Python fallback — simple linear regression
        x_vals = list(range(n))
        x_mean = sum(x_vals) / n
        y_mean = sum(scores) / n

        numerator = sum((x_vals[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
        denominator = sum((x_vals[i] - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator != 0 else 0
        intercept = y_mean - slope * x_mean
        predicted = max(0, min(100, intercept + slope * n))
        confidence = 0.6  # fixed confidence for fallback

    # Classify trend
    if slope > 1.5:
        trend = "improving"
    elif slope < -1.5:
        trend = "declining"
    elif slope > 0.3:
        trend = "slightly_improving"
    elif slope < -0.3:
        trend = "slightly_declining"
    else:
        trend = "stable"

    # Volatility (standard deviation)
    mean = sum(scores) / n
    variance = sum((s - mean) ** 2 for s in scores) / n
    volatility = variance ** 0.5

    return {
        "trend": trend,
        "prediction": round(predicted),
        "confidence": round(confidence, 2),
        "slope": round(slope, 3),
        "average": round(mean, 1),
        "volatility": round(volatility, 1),
        "dataPoints": n,
        "message": _trend_message(trend, round(predicted)),
    }


def _trend_message(trend: str, prediction: int) -> str:
    messages = {
        "improving": f"Your mood is trending upward. Predicted next score: {prediction}/100.",
        "declining": f"Your mood has been declining. Consider reaching out for extra support. Predicted: {prediction}/100.",
        "slightly_improving": f"Your mood is gradually improving. Keep up the good work! Predicted: {prediction}/100.",
        "slightly_declining": f"Your mood has dipped slightly. Small self-care steps can help. Predicted: {prediction}/100.",
        "stable": f"Your mood has been stable. Predicted: {prediction}/100.",
        "insufficient_data": "Not enough data to predict trend yet.",
    }
    return messages.get(trend, "")
