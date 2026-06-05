from flask import Blueprint, request, jsonify
from models.themes_model import extract_themes

themes_bp = Blueprint("themes", __name__)


@themes_bp.route("/themes", methods=["POST"])
def predict_themes():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body is required"}), 400

    messages = data.get("messages", [])
    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({"success": False, "message": "'messages' must be a non-empty array"}), 400

    # Accept both string arrays and message objects
    texts = []
    for m in messages:
        if isinstance(m, str):
            texts.append(m)
        elif isinstance(m, dict) and m.get("content"):
            texts.append(m["content"])

    result = extract_themes(texts)
    return jsonify({"success": True, **result}), 200
