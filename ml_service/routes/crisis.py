from flask import Blueprint, request, jsonify
from models.crisis_model import detect_crisis

crisis_bp = Blueprint("crisis", __name__)


@crisis_bp.route("/crisis", methods=["POST"])
def predict_crisis():
    data = request.get_json(silent=True)
    if not data or not data.get("text"):
        return jsonify({"success": False, "message": "Field 'text' is required"}), 400

    text = str(data["text"]).strip()
    result = detect_crisis(text)
    return jsonify({"success": True, **result}), 200
