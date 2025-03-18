from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import math

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

port = os.getenv('PORT', 5001)

@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config.get('SECRET_KEY', 'no_key_set'),
        'port': port
    }

@app.route('/reset_scene', methods=['POST'])
def reset_scene():
    try:
        # Add any server-side reset logic here
        print("🔄 Resetting scene from Flask endpoint")
        
        # Default state to return if no actual environment exists
        state = {
            'robot_position': [7, 0.1, 15], 
            'robot_rotation': [0, -math.pi / 2, 0, 1],
            'target_object': 'unknown', 
            'time_left': 500
        }
        
        # Return success with state data
        return jsonify({
            'status': 'success',
            'message': 'Scene reset successfully',
            'data': state
        })
    except Exception as e:
        print(f"❌ Error in reset_scene: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error resetting scene: {str(e)}'
        }), 500
    
@app.route('/process_action', methods=['POST'])
def process_action():
    try:
        data = request.json
        action = data.get('action')
        state = data.get('state', {})
        
        print(f"Processing action: {action}")
        
        # Simple mock reward calculation
        reward = 0
        if action == 'v':  # Take picture action
            # Extract data from state
            target_object = state.get('target_object')
            detections = state.get('detections', [])
            objects_in_view = state.get('objects_in_view', [])
            
            # Check if target object is in view
            target_in_view = any(obj.get('id') == target_object for obj in objects_in_view)
            
            # Check if target object is detected
            target_detected = any(det.get('class_id') == target_object for det in detections)
            
            if target_in_view:
                reward = 1000  # Maximum reward
                print(f"Target object {target_object} is in view! Maximum reward.")
            elif target_detected:
                reward = 500   # Medium reward
                print(f"Target object {target_object} is detected! Medium reward.")
            else:
                reward = 50    # Small reward for taking any picture
                print("No target object detected or in view. Small reward.")
        
        return jsonify({
            'status': 'success',
            'action': action,
            'reward': reward,
            'done': action == 'v'  # Episode is done if we took a picture
        })
    except Exception as e:
        print(f"❌ Error in process_action: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error processing action: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=int(port), host='0.0.0.0')