import pickle
import os
import spacy
import re
import numpy as np
from typing import Dict, Any, List, Tuple

class SymptomCheckerTester:
    def __init__(self, model_dir: str = '../models'):
        """
        Initialize the tester for the symptom checker model
        
        Args:
            model_dir: Directory where trained models are stored
        """
        self.model_dir = model_dir
        self.nlp = spacy.load('en_core_web_sm')
        
        # Load all saved models and data
        self.load_models()
    
    def load_models(self) -> None:
        """
        Load all the trained models and associated data
        """
        try:
            with open(f'{self.model_dir}/vectorizer.pkl', 'rb') as f:
                self.vectorizer = pickle.load(f)
            
            with open(f'{self.model_dir}/classifier.pkl', 'rb') as f:
                self.classifier = pickle.load(f)
            
            with open(f'{self.model_dir}/label_encoder.pkl', 'rb') as f:
                self.label_encoder = pickle.load(f)
            
            with open(f'{self.model_dir}/responses.pkl', 'rb') as f:
                self.responses = pickle.load(f)
            
            with open(f'{self.model_dir}/precautions.pkl', 'rb') as f:
                self.precautions = pickle.load(f)
            
            with open(f'{self.model_dir}/entities.pkl', 'rb') as f:
                self.entities = pickle.load(f)
            
            with open(f'{self.model_dir}/required_entities.pkl', 'rb') as f:
                self.required_entities = pickle.load(f)
                
            print("All models and data loaded successfully!")
            
        except FileNotFoundError as e:
            print(f"Error loading models: {e}")
            print("Have you trained the model yet? Run the trainer first.")
            exit(1)
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess input text by lowercasing, removing punctuation, and lemmatizing
        """
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        doc = self.nlp(text)
        return ' '.join([token.lemma_ for token in doc if not token.is_stop])
    
    def predict_condition(self, symptoms: str) -> Tuple[str, float]:
        """
        Predict the medical condition based on symptoms
        
        Args:
            symptoms: String describing symptoms
            
        Returns:
            tuple: (predicted_condition, confidence_score)
        """
        # Preprocess the input
        processed_text = self.preprocess_text(symptoms)
        
        # Vectorize
        X = self.vectorizer.transform([processed_text])
        
        # Get prediction probabilities
        probs = self.classifier.predict_proba(X)[0]
        
        # Get the index of the highest probability
        max_prob_idx = np.argmax(probs)
        
        # Get the predicted label and its probability
        predicted_label_idx = max_prob_idx
        confidence = probs[max_prob_idx]
        
        # Convert the label index back to the original category
        predicted_condition = self.label_encoder.inverse_transform([predicted_label_idx])[0]
        
        return predicted_condition, confidence
    
    def extract_symptoms_from_input(self, input_text: str) -> List[str]:
        """
        Extract individual symptoms from input text
        
        Args:
            input_text: User input describing symptoms
            
        Returns:
            list: List of extracted symptoms
        """
        # Simple extraction by comma separation
        if ',' in input_text:
            return [s.strip() for s in input_text.split(',')]
        else:
            # Try to identify symptoms using NLP
            doc = self.nlp(input_text)
            chunks = [chunk.text for chunk in doc.noun_chunks]
            
            # If we couldn't extract meaningful chunks, return the whole text
            if not chunks:
                return [input_text.strip()]
            return chunks
    
    def match_entities(self, symptoms: List[str], condition: str) -> float:
        """
        Check how well symptoms match with entities for the condition
        
        Args:
            symptoms: List of symptoms from user input
            condition: Predicted condition
            
        Returns:
            float: Match score between 0 and 1
        """
        if condition not in self.entities:
            return 0.0
        
        condition_entities = self.entities[condition]
        required_entities = self.required_entities.get(condition, [])
        
        # Count how many symptoms match the condition entities
        matches = 0
        required_matches = 0
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            
            # Check for partial matches
            for entity in condition_entities:
                if symptom_lower in entity.lower() or entity.lower() in symptom_lower:
                    matches += 1
                    break
            
            # Check required entities
            for req_entity in required_entities:
                if symptom_lower in req_entity.lower() or req_entity.lower() in symptom_lower:
                    required_matches += 1
                    break
        
        # Calculate match score
        entity_match = matches / len(condition_entities) if condition_entities else 0
        required_match = required_matches / len(required_entities) if required_entities else 1
        
        # Required entities are weighted more heavily
        return 0.4 * entity_match + 0.6 * required_match
    
    def get_top_conditions(self, symptoms: str, top_n: int = 3) -> List[Dict[str, Any]]:
        """
        Get top N predicted conditions with their responses and precautions
        
        Args:
            symptoms: String describing symptoms
            top_n: Number of top conditions to return
            
        Returns:
            list: Top N conditions with details
        """
        # Preprocess the input
        processed_text = self.preprocess_text(symptoms)
        
        # Vectorize
        X = self.vectorizer.transform([processed_text])
        
        # Get prediction probabilities
        probs = self.classifier.predict_proba(X)[0]
        
        # Get indices of top N probabilities
        top_indices = probs.argsort()[-top_n:][::-1]
        
        # Extract individual symptoms
        symptom_list = self.extract_symptoms_from_input(symptoms)
        
        results = []
        for idx in top_indices:
            condition = self.label_encoder.inverse_transform([idx])[0]
            confidence = probs[idx]
            
            # Get entity match score
            entity_match = self.match_entities(symptom_list, condition)
            
            # Calculate combined score
            combined_score = 0.7 * confidence + 0.3 * entity_match
            
            results.append({
                'condition': condition,
                'confidence': confidence,
                'entity_match': entity_match,
                'combined_score': combined_score,
                'response': self.responses.get(condition, "No specific response available."),
                'precaution': self.precautions.get(condition, "No specific precautions available.")
            })
        
        # Sort by combined score
        results.sort(key=lambda x: x['combined_score'], reverse=True)
        
        return results
    
    def interactive_test(self) -> None:
        """
        Run an interactive test of the symptom checker
        """
        print("\n===== SYMPTOM CHECKER TEST =====")
        print("Enter your symptoms below (or 'quit' to exit)")
        
        while True:
            user_input = input("\nDescribe your symptoms: ")
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Thank you for using the Symptom Checker. Goodbye!")
                break
            
            if not user_input.strip():
                print("Please enter some symptoms.")
                continue
            
            # Get top conditions
            top_results = self.get_top_conditions(user_input)
            
            print("\n----- POSSIBLE CONDITIONS -----")
            for i, result in enumerate(top_results):
                print(f"\n{i+1}. {result['condition']} (Confidence: {result['confidence']:.2f}, Match: {result['entity_match']:.2f})")
                
                # Clean up response and precaution by replacing HTML line breaks with actual line breaks
                response = result['response'].replace('<br>', '\n')
                precaution = result['precaution'].replace('<br>', '\n')
                
                print(f"\n{response}")
                print(f"\n{precaution}")
                print("\n" + "-" * 40)
            
            print("\nNOTE: This is an automated prediction and not a medical diagnosis.")
            print("Always consult with a healthcare professional for proper medical advice.")

def run_batch_test(tester, test_cases):
    """
    Run batch testing with predefined test cases
    
    Args:
        tester: SymptomCheckerTester instance
        test_cases: Dictionary of test cases with expected conditions
    """
    print("\n===== BATCH TESTING =====")
    correct = 0
    
    for symptoms, expected in test_cases.items():
        predicted, confidence = tester.predict_condition(symptoms)
        
        result = "✓ CORRECT" if predicted == expected else "✗ WRONG"
        if predicted == expected:
            correct += 1
            
        print(f"Symptoms: '{symptoms}'")
        print(f"Expected: {expected}, Predicted: {predicted} (Confidence: {confidence:.2f})")
        print(f"Result: {result}\n")
    
    accuracy = correct / len(test_cases) if test_cases else 0
    print(f"Test Accuracy: {accuracy:.2f} ({correct}/{len(test_cases)})")

if __name__ == "__main__":
    # Create tester instance
    tester = SymptomCheckerTester()
    
    # Define some test cases
    test_cases = {
        "I have a headache and nasal congestion": "Sinusitis",
        "My eyes are red and itchy": "Pink Eye",
        "I feel heartburn after eating": "Acid Reflux",
        "It burns when I urinate": "UTI",
        "I'm feeling dizzy and my mouth is very dry": "Dehydration",
        "My ankle is swollen and painful": "Sprained Ankle",
        "I've been vomiting and have stomach cramps": "Food Poisoning",
        "I'm sweating a lot and feel weak": "Heat Exhaustion",
        "My nose is runny and I keep sneezing": "Seasonal Allergies",
        "My ear hurts and I can't hear well": "Ear Infection"
    }
    
    # Run batch test
    run_batch_test(tester, test_cases)
    
    # Run interactive test
    tester.interactive_test()