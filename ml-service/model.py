import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from preprocess import preprocess_texts


class EmotionClassifier:
    """
    Emotion classification model using TF-IDF and Logistic Regression.
    """
    
    def __init__(self, model_type='logistic'):
        """
        Initialize the emotion classifier.
        
        Args:
            model_type: Type of classifier ('logistic' or 'naive_bayes')
        """
        self.model_type = model_type
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.model = None
        self.emotions = ['Happy', 'Sad', 'Anxiety', 'Angry', 'Neutral', 'Stressed']
        
    def load_data(self, data_path: str) -> pd.DataFrame:
        """
        Load training data from CSV file.
        
        Args:
            data_path: Path to the CSV file
            
        Returns:
            DataFrame with 'text' and 'emotion' columns
        """
        df = pd.read_csv(data_path)
        return df
    
    def train(self, data_path: str):
        """
        Train the emotion classifier.
        
        Args:
            data_path: Path to the training data CSV file
        """
        # Load data
        df = self.load_data(data_path)
        
        # Preprocess texts
        X = preprocess_texts(df['text'].tolist())
        y = df['emotion'].tolist()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Vectorize text
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Initialize model
        if self.model_type == 'logistic':
            self.model = LogisticRegression(max_iter=1000, random_state=42)
        elif self.model_type == 'naive_bayes':
            self.model = MultinomialNB()
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
        
        # Train model
        self.model.fit(X_train_vec, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
    def predict(self, text: str) -> str:
        """
        Predict emotion for a single text.
        
        Args:
            text: Input text string
            
        Returns:
            Predicted emotion label
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Preprocess text
        cleaned_text = preprocess_texts([text])[0]
        
        # Vectorize
        text_vec = self.vectorizer.transform([cleaned_text])
        
        # Predict
        prediction = self.model.predict(text_vec)[0]
        
        return prediction
    
    def save(self, model_path: str, vectorizer_path: str):
        """
        Save the trained model and vectorizer.
        
        Args:
            model_path: Path to save the model
            vectorizer_path: Path to save the vectorizer
        """
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(vectorizer_path, 'wb') as f:
            pickle.dump(self.vectorizer, f)
        
        print(f"Model saved to {model_path}")
        print(f"Vectorizer saved to {vectorizer_path}")
    
    def load(self, model_path: str, vectorizer_path: str):
        """
        Load a trained model and vectorizer.
        
        Args:
            model_path: Path to the saved model
            vectorizer_path: Path to the saved vectorizer
        """
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        with open(vectorizer_path, 'rb') as f:
            self.vectorizer = pickle.load(f)
        
        print(f"Model loaded from {model_path}")
        print(f"Vectorizer loaded from {vectorizer_path}")


if __name__ == "__main__":
    # Train and save the model
    classifier = EmotionClassifier(model_type='logistic')
    
    # Train on dataset
    data_path = os.path.join(os.path.dirname(__file__), 'dataset', 'emotion_data.csv')
    classifier.train(data_path)
    
    # Save model
    model_dir = os.path.dirname(__file__)
    classifier.save(
        os.path.join(model_dir, 'emotion_model.pkl'),
        os.path.join(model_dir, 'vectorizer.pkl')
    )
