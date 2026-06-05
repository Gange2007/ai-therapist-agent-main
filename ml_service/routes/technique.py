from flask import Blueprint, request, jsonify
from models.technique_model import recommend_technique

technique_bp = Blueprint("technique", __name__)


@technique_bp.route("/technique", methods=["POST"])
def predict_technique():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body is required"}), 400

    messages = data.get("messages", [])
    current_emotion = data.get("currentEmotion", "neutral")

    if not isinstance(messages, list):
        return jsonify({"success": False, "message": "'messages' must be an array"}), 400

    result = recommend_technique(messages, current_emotion)
    return jsonify({"success": True, **result}), 200
