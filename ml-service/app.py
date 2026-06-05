from flask import Flask, request, jsonify
from model import EmotionClassifier
import os

app = Flask(__name__)

# Initialize classifier
classifier = EmotionClassifier(model_type='logistic')

# Load trained model
model_dir = os.path.dirname(__file__)
model_path = os.path.join(model_dir, 'emotion_model.pkl')
vectorizer_path = os.path.join(model_dir, 'vectorizer.pkl')

# Check if model exists, if not, train it
if os.path.exists(model_path) and os.path.exists(vectorizer_path):
    classifier.load(model_path, vectorizer_path)
    print("Loaded pre-trained model")
else:
    print("Model not found. Training new model...")
    data_path = os.path.join(model_dir, 'dataset', 'emotion_data.csv')
    classifier.train(data_path)
    classifier.save(model_path, vectorizer_path)


@app.route('/predict-emotion', methods=['POST'])
def predict_emotion():
    """
    Predict emotion from user message.
    
    Expected input:
    {
        "message": "I feel stressed"
    }
    
    Output:
    {
        "emotion": "Anxiety"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message field is required'}), 400
        
        message = data['message']
        
        if not message or not isinstance(message, str):
            return jsonify({'error': 'Message must be a non-empty string'}), 400
        
        # Predict emotion
        emotion = classifier.predict(message)
        
        return jsonify({'emotion': emotion}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
