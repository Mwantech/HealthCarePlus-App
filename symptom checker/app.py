from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from models.symptom_checker import SymptomChecker
import os

app = Flask(__name__)

# Enable CORS for requests from localhost:8081
CORS(app, resources={r"/*": {"origins": "http://192.168.35.185:8081"}})

# Initialize the symptom checker
symptom_checker = SymptomChecker(model_dir='models')

@app.route('/api/start_session', methods=['POST'])
def start_session():
    """
    Start a new symptom checker session
    """
    try:
        result = symptom_checker.start_session()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error starting session: {str(e)}'
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Process a message in a symptom checker session
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        session_id = data.get('session_id')
        message = data.get('message')
        
        if not session_id or not message:
            return jsonify({
                'status': 'error',
                'message': 'Session ID and message are required'
            }), 400
        
        result = symptom_checker.process_message(session_id, message)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error processing message: {str(e)}'
        }), 500

@app.route('/api/end_session', methods=['POST'])
def end_session():
    """
    End a symptom checker session
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'status': 'error',
                'message': 'Session ID is required'
            }), 400
        
        result = symptom_checker.end_session(session_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error ending session: {str(e)}'
        }), 500

@app.route('/api/check_symptoms', methods=['POST'])
def check_symptoms():
    """
    Direct symptom check without session management
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        symptoms = data.get('symptoms')
        
        if not symptoms:
            return jsonify({
                'status': 'error',
                'message': 'Symptoms are required'
            }), 400
        
        result = symptom_checker.get_response(symptoms)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error checking symptoms: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'success',
        'message': 'Symptom checker API is running'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
