import pickle
import re
import spacy
import random
from typing import Dict, Any, List, Optional
from datetime import datetime

class SymptomChecker:
    def __init__(self, model_dir='models'):
        """
        Initialize the SymptomChecker with trained models and data
        """
        self.nlp = spacy.load('en_core_web_sm')
        
        # Load all saved components
        with open(f'{model_dir}/vectorizer.pkl', 'rb') as f:
            self.vectorizer = pickle.load(f)
            
        with open(f'{model_dir}/classifier.pkl', 'rb') as f:
            self.classifier = pickle.load(f)
            
        with open(f'{model_dir}/label_encoder.pkl', 'rb') as f:
            self.label_encoder = pickle.load(f)
            
        with open(f'{model_dir}/responses.pkl', 'rb') as f:
            self.responses = pickle.load(f)
            
        with open(f'{model_dir}/precautions.pkl', 'rb') as f:
            self.precautions = pickle.load(f)
            
        with open(f'{model_dir}/entities.pkl', 'rb') as f:
            self.entities = pickle.load(f)
            
        with open(f'{model_dir}/required_entities.pkl', 'rb') as f:
            self.required_entities = pickle.load(f)
        
        # Define conversation intents that should not be treated as medical conditions
        self.conversation_intents = ['greeting', 'goodbye', 'Thanks', 'joke', 'who', 'work']
        
        # Active sessions storage
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess input text for prediction
        """
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        doc = self.nlp(text)
        return ' '.join([token.lemma_ for token in doc if not token.is_stop])
    
    def extract_symptoms(self, text: str) -> List[str]:
        """
        Extract symptoms from user text
        """
        # Convert commas or 'and' to standardize for splitting
        text = text.replace(' and ', ', ')
        
        # Split by comma and clean
        symptoms = [s.strip().lower() for s in text.split(',') if s.strip()]
        
        # For each entity in our known symptoms, check if it's in the text
        all_symptoms = []
        for condition, symptom_list in self.entities.items():
            # Skip conversation intents
            if condition in self.conversation_intents:
                continue
            all_symptoms.extend(symptom_list)
        
        # Remove duplicates
        all_symptoms = list(set(all_symptoms))
        
        # Find matching symptoms
        matches = []
        for symptom in all_symptoms:
            if symptom.lower() in text.lower():
                matches.append(symptom)
        
        # If we found direct matches, use them
        if matches:
            return matches
        
        # Otherwise return the split symptoms
        return symptoms
    
    def is_conversation_intent(self, text: str) -> Dict[str, Any]:
        """
        Check if the text matches a conversation intent rather than a medical symptom
        """
        # Preprocess input text
        processed_text = self.preprocess_text(text)
        
        # Vectorize text
        X = self.vectorizer.transform([processed_text])
        
        # Predict intent with probabilities
        probas = self.classifier.predict_proba(X)[0]
        
        # Get intent class index
        intent_idx = self.classifier.predict(X)[0]
        intent = self.label_encoder.inverse_transform([intent_idx])[0]
        
        # Check if it's a conversation intent
        if intent in self.conversation_intents:
            confidence = probas[intent_idx]
            response = self.responses.get(intent, "I didn't understand that. Please describe your symptoms.")
            
            return {
                'is_conversation': True,
                'intent': intent,
                'confidence': confidence,
                'response': response
            }
        
        return {'is_conversation': False}
    
    def predict_condition(self, symptoms_text: str) -> Dict[str, Any]:
        """
        Predict potential medical condition based on symptoms
        """
        try:
            # First check if this is a conversation intent rather than symptoms
            conversation_check = self.is_conversation_intent(symptoms_text)
            if conversation_check['is_conversation']:
                return conversation_check
            
            # Preprocess input text
            processed_text = self.preprocess_text(symptoms_text)
            
            # Vectorize text
            X = self.vectorizer.transform([processed_text])
            
            # Predict condition with probabilities
            probas = self.classifier.predict_proba(X)[0]
            
            # Get condition class index
            condition_idx = self.classifier.predict(X)[0]
            condition = self.label_encoder.inverse_transform([condition_idx])[0]
            
            # If the predicted condition is a conversation intent but confidence is low,
            # handle it as a potential symptom description
            if condition in self.conversation_intents:
                # Check if there are any medical keywords in the text
                symptoms = self.extract_symptoms(symptoms_text)
                if not symptoms:
                    return {
                        'is_conversation': True,
                        'intent': condition,
                        'confidence': probas[condition_idx],
                        'response': self.responses.get(condition, "I didn't understand that. Please describe your symptoms.")
                    }
            
            # Extract symptoms
            symptoms = self.extract_symptoms(symptoms_text)
            
            # If no symptoms extracted and predicted as conversation, treat as conversation
            if not symptoms and condition in self.conversation_intents:
                return {
                    'is_conversation': True,
                    'intent': condition,
                    'confidence': probas[condition_idx],
                    'response': self.responses.get(condition, "I didn't understand that. Please describe your symptoms.")
                }
            
            # Skip conversation intents for medical prediction
            if condition in self.conversation_intents:
                # Find the highest probability non-conversation intent
                non_conv_intents = [(i, p) for i, p in enumerate(probas) 
                                  if self.label_encoder.inverse_transform([i])[0] not in self.conversation_intents]
                
                if non_conv_intents:
                    # Sort by probability and get the highest
                    non_conv_intents.sort(key=lambda x: x[1], reverse=True)
                    condition_idx = non_conv_intents[0][0]
                    condition = self.label_encoder.inverse_transform([condition_idx])[0]
                else:
                    # No medical condition found
                    return {
                        'status': 'no_condition',
                        'message': "I couldn't identify any medical conditions from your description. Please provide more details about your symptoms."
                    }
            
            # Get matched symptoms from our known list for this condition
            matched_symptoms = []
            condition_symptoms = self.entities.get(condition, [])
            for symptom in symptoms:
                for known_symptom in condition_symptoms:
                    if symptom in known_symptom.lower() or known_symptom.lower() in symptom:
                        matched_symptoms.append(known_symptom)
            
            # Check if required symptoms are present
            required = self.required_entities.get(condition, [])
            missing_required = []
            
            for req in required:
                found = False
                for symptom in symptoms:
                    if symptom in req.lower() or req.lower() in symptom:
                        found = True
                        break
                if not found:
                    missing_required.append(req)
            
            # Get response
            response = self.responses.get(condition, "I'm not sure what condition you might have. Please consult with a healthcare provider.")
            
            # Get precautions
            precaution = self.precautions.get(condition, "Please consult with a healthcare provider for appropriate precautions.")
            
            # Determine confidence level
            confidence = probas[condition_idx]
            
            # Determine if we should ask for more information
            needs_more_info = len(missing_required) > 0 and confidence < 0.8
            
            return {
                'is_conversation': False,
                'condition': condition,
                'confidence': confidence,
                'symptoms': symptoms,
                'matched_symptoms': list(set(matched_symptoms)),
                'response': response,
                'precaution': precaution,
                'missing_symptoms': missing_required,
                'needs_more_info': needs_more_info
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error predicting condition: {str(e)}'
            }
    
    def get_response(self, text: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get response for user message
        """
        # Check if active session and previous context
        context = {}
        if session_id and session_id in self.active_sessions:
            context = self.active_sessions[session_id].get('context', {})
        
        # Predict condition based on symptoms text
        prediction = self.predict_condition(text)
        
        if 'status' in prediction and prediction['status'] == 'error':
            return prediction
        
        # Handle conversation intents
        if 'is_conversation' in prediction and prediction['is_conversation']:
            intent = prediction['intent']
            response = prediction['response']
            
            return {
                'status': 'success',
                'is_conversation': True,
                'intent': intent,
                'response': response
            }
        
        # Handle no condition found
        if 'status' in prediction and prediction['status'] == 'no_condition':
            return prediction
        
        # If we need more information, ask for it
        if prediction['needs_more_info']:
            missing = prediction['missing_symptoms']
            response = f"Based on your symptoms, you might have {prediction['condition']}, but I need more information. Do you also have any of these symptoms: {', '.join(missing)}?"
            
            return {
                'status': 'needs_more_info',
                'condition': prediction['condition'],
                'confidence': prediction['confidence'],
                'response': response,
                'missing_symptoms': missing
            }
        
        # Otherwise, provide the condition response
        response = prediction['response']
        precaution = prediction['precaution']
        
        # Store prediction in context if session exists
        if session_id:
            if session_id not in self.active_sessions:
                self.active_sessions[session_id] = {'context': {}}
            
            self.active_sessions[session_id]['context'] = {
                'condition': prediction['condition'],
                'symptoms': prediction['symptoms'],
                'last_response': response
            }
        
        return {
            'status': 'success',
            'condition': prediction['condition'],
            'confidence': prediction['confidence'],
            'symptoms': prediction['symptoms'],
            'matched_symptoms': prediction['matched_symptoms'],
            'response': response,
            'precaution': precaution
        }
    
    def start_session(self) -> Dict[str, Any]:
        """
        Start a new symptom checker session
        """
        try:
            # Generate session ID
            session_id = f"session_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
            
            # Store session info in memory
            self.active_sessions[session_id] = {
                'start_time': datetime.utcnow(),
                'context': {},
                'messages': []
            }
            
            return {
                'status': 'success',
                'session_id': session_id,
                'message': 'Welcome to the symptom checker. Please describe your symptoms.'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error starting session: {str(e)}'
            }
    
    def process_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """
        Process incoming message with context management
        """
        try:
            # Check for active session
            if session_id not in self.active_sessions:
                return {'status': 'error', 'message': 'No active session found'}
            
            # Get response based on symptoms
            response = self.get_response(message, session_id)
            
            # Save message to session history
            self.active_sessions[session_id]['messages'].append({
                'user': message,
                'response': response,
                'timestamp': datetime.utcnow()
            })
            
            return response
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error processing message: {str(e)}'
            }
    
    def end_session(self, session_id: str) -> Dict[str, Any]:
        """
        End a symptom checker session
        """
        try:
            if session_id in self.active_sessions:
                # Get session context for summary
                context = self.active_sessions[session_id].get('context', {})
                
                # Clear session from memory
                del self.active_sessions[session_id]
                
                # Generate summary
                condition = context.get('condition', 'Unknown')
                
                return {
                    'status': 'success',
                    'message': f'Your symptom check session has ended. Based on your symptoms, the potential condition is: {condition}. Please consult with a healthcare provider for proper diagnosis and treatment.',
                    'condition': condition
                }
            
            return {
                'status': 'error',
                'message': 'No active session found'
            }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error ending session: {str(e)}'
            }