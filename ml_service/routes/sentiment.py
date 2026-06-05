from flask import Blueprint, request, jsonify
from models.sentiment_model import analyze_sentiment

sentiment_bp = Blueprint("sentiment", __name__)


@sentiment_bp.route("/sentiment", methods=["POST"])
def predict_sentiment():
    data = request.get_json(silent=True)
    if not data or not data.get("text"):
        return jsonify({"success": False, "message": "Field 'text' is required"}), 400

    text = str(data["text"]).strip()
    if len(text) > 5000:
        text = text[:5000]

    result = analyze_sentiment(text)
    return jsonify({"success": True, **result}), 200
