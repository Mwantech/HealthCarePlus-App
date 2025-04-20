from typing import Dict, Any, List
import numpy as np
import pandas as pd
import json
import re
import pickle
import os
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier

class SymptomCheckerTrainer:
    def __init__(self, data_path: str = '../data/symptom_intents.json', model_dir: str = '../models'):
        """
        Initialize the trainer for the symptom checker model
        
        Args:
            data_path: Path to the JSON file containing symptom data
            model_dir: Directory to save trained models
        """
        self.data_path = data_path
        self.model_dir = model_dir
        self.nlp = spacy.load('en_core_web_sm')
        
        # Create model directory if it doesn't exist
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
    
    def load_data(self) -> List[Dict[str, Any]]:
        """
        Load symptom data from JSON file
        """
        with open(self.data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract the list of intents from the data
        if isinstance(data, dict) and 'intents' in data:
            return data['intents']
        
        # If the data is not structured with an 'intents' key, try to use it directly
        if isinstance(data, list):
            return data
            
        raise ValueError("JSON data structure is not compatible. Expected a list of intents or a dictionary with 'intents' key.")
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess input text by lowercasing, removing punctuation, and lemmatizing
        """
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        doc = self.nlp(text)
        return ' '.join([token.lemma_ for token in doc if not token.is_stop])
    
    def prepare_training_data(self, symptom_data: List[Dict[str, Any]]) -> tuple:
        """
        Prepare training data from symptom data
        
        Returns:
            X_train: Symptom pattern texts
            y_train: Associated condition labels
            responses: Dictionary mapping condition to response
            precautions: Dictionary mapping condition to precautions
        """
        X_train = []
        y_train = []
        responses = {}
        precautions = {}
        
        for item in symptom_data:
            tag = item['tag']
            patterns = item['patterns']
            response = item['responses']
            precaution = item.get('Precaution', '')
            
            # Add each pattern with its tag
            for pattern in patterns:
                X_train.append(self.preprocess_text(pattern))
                y_train.append(tag)
            
            # Save response and precaution
            responses[tag] = response
            precautions[tag] = precaution
        
        return X_train, y_train, responses, precautions
    
    def extract_entities(self, symptom_data: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Extract symptom entities from patterns
        """
        entities = {}
        required_entities = {}
        
        for item in symptom_data:
            tag = item['tag']
            entities[tag] = []
            required_entities[tag] = []
            
            # Extract symptoms from patterns
            for pattern in item['patterns']:
                # Check if pattern contains commas for symptom separation
                if ',' in pattern:
                    symptoms = [s.strip() for s in pattern.split(',')]
                    entities[tag].extend(symptoms)
                    
                    # Consider first pattern's symptoms as required
                    if len(required_entities[tag]) == 0:
                        required_entities[tag] = symptoms
                else:
                    # If no commas, treat the whole pattern as a single entity
                    entities[tag].append(pattern.strip())
                    
                    # Add to required entities if empty
                    if len(required_entities[tag]) == 0:
                        required_entities[tag] = [pattern.strip()]
            
            # Remove duplicates
            entities[tag] = list(set(entities[tag]))
        
        return entities, required_entities
    
    def train_model(self) -> None:
        """
        Train the symptom checker model
        """
        # Load and prepare data
        symptom_data = self.load_data()
        
        # Debug the data structure
        print(f"Loaded {len(symptom_data)} intent items")
        
        X_train, y_train, responses, precautions = self.prepare_training_data(symptom_data)
        
        print(f"Prepared {len(X_train)} training samples across {len(set(y_train))} categories")
        
        # Extract symptom entities
        entities, required_entities = self.extract_entities(symptom_data)
        
        # Vectorize text
        vectorizer = TfidfVectorizer(max_features=1000)
        X = vectorizer.fit_transform(X_train)
        
        # Encode labels
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_train)
        
        # Train classifier
        classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        classifier.fit(X, y)
        
        print(f"Trained classifier with {classifier.n_estimators} trees")
        
        # Save models and data
        with open(f'{self.model_dir}/vectorizer.pkl', 'wb') as f:
            pickle.dump(vectorizer, f)
        
        with open(f'{self.model_dir}/classifier.pkl', 'wb') as f:
            pickle.dump(classifier, f)
        
        with open(f'{self.model_dir}/label_encoder.pkl', 'wb') as f:
            pickle.dump(label_encoder, f)
        
        with open(f'{self.model_dir}/responses.pkl', 'wb') as f:
            pickle.dump(responses, f)
        
        with open(f'{self.model_dir}/precautions.pkl', 'wb') as f:
            pickle.dump(precautions, f)
        
        with open(f'{self.model_dir}/entities.pkl', 'wb') as f:
            pickle.dump(entities, f)
        
        with open(f'{self.model_dir}/required_entities.pkl', 'wb') as f:
            pickle.dump(required_entities, f)
        
        print("Model training completed successfully!")
        print(f"All models and data saved to {self.model_dir}/")

if __name__ == "__main__":
    trainer = SymptomCheckerTrainer()
    trainer.train_model()