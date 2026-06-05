"""
Flask ML Service for AI Therapist Agent
Port: 8000  (Node backend runs on 5000, Next.js on 3000)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from datetime import datetime

load_dotenv()

from routes.sentiment import sentiment_bp
from routes.crisis import crisis_bp
from routes.technique import technique_bp
from routes.themes import themes_bp
from routes.mood_trend import mood_trend_bp

# ─── App ──────────────────────────────────────────────────────────────────────
app = Flask(__name__)

allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:3000").split(",")
CORS(app, origins=[o.strip() for o in allowed])

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Blueprints ───────────────────────────────────────────────────────────────
app.register_blueprint(sentiment_bp, url_prefix="/predict")
app.register_blueprint(crisis_bp,    url_prefix="/predict")
app.register_blueprint(technique_bp, url_prefix="/predict")
app.register_blueprint(themes_bp,    url_prefix="/predict")
app.register_blueprint(mood_trend_bp,url_prefix="/predict")

# ─── Health ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "AI Therapist ML Service",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": [
            "POST /predict/sentiment",
            "POST /predict/crisis",
            "POST /predict/technique",
            "POST /predict/themes",
            "POST /predict/mood-trend",
        ],
    }), 200

# ─── Error handlers ───────────────────────────────────────────────────────────
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"success": False, "message": str(e)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "message": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify({"success": False, "message": "Internal server error"}), 500

# ─── Entry ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    logger.info(f"ML service starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
