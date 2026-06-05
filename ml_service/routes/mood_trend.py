from flask import Blueprint, request, jsonify
from models.mood_trend_model import predict_mood_trend

mood_trend_bp = Blueprint("mood_trend", __name__)


@mood_trend_bp.route("/mood-trend", methods=["POST"])
def predict_trend():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body is required"}), 400

    mood_history = data.get("moodHistory", [])
    if not isinstance(mood_history, list):
        return jsonify({"success": False, "message": "'moodHistory' must be an array"}), 400

    result = predict_mood_trend(mood_history)
    return jsonify({"success": True, **result}), 200
