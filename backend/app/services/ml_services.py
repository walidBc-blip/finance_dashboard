from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from ..models import Transaction

class MLService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.label_encoder = None
        self.is_trained = False
        
        # Try to load existing model
        self.load_model()
    
    def train_categorization_model(self, db: Session):
        """Train ML model for transaction categorization"""
        transactions = db.query(Transaction).all()
        if len(transactions) < 50:  # Need minimum data for training
            return False
        
        # Prepare training data
        descriptions = [t.description.lower() for t in transactions]
        categories = [t.category for t in transactions]
        
        # Feature extraction using TF-IDF
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)  # Include bigrams
        )
        X = self.vectorizer.fit_transform(descriptions)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(categories)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.model.fit(X, y)
        
        self.is_trained = True
        
        # Save model
        self.save_model()
        
        return True
    
    def predict_category(self, description: str):
        """Predict category for a transaction description"""
        if not self.is_trained:
            return "Other"
        
        try:
            description_vector = self.vectorizer.transform([description.lower()])
            prediction = self.model.predict(description_vector)[0]
            return self.label_encoder.inverse_transform([prediction])[0]
        except:
            return "Other"
    
    def save_model(self):
        """Save the trained model to disk"""
        if self.is_trained:
            joblib.dump(self.model, 'transaction_classifier.pkl')
            joblib.dump(self.vectorizer, 'text_vectorizer.pkl')
            joblib.dump(self.label_encoder, 'label_encoder.pkl')
    
    def load_model(self):
        """Load existing model from disk"""
        try:
            if (os.path.exists('transaction_classifier.pkl') and
                os.path.exists('text_vectorizer.pkl') and
                os.path.exists('label_encoder.pkl')):
                
                self.model = joblib.load('transaction_classifier.pkl')
                self.vectorizer = joblib.load('text_vectorizer.pkl')
                self.label_encoder = joblib.load('label_encoder.pkl')
                self.is_trained = True
                return True
        except:
            pass
        
        return False