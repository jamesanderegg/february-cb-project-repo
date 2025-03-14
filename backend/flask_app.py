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

if __name__ == '__main__':
    app.run(debug=True, port=int(port), host='0.0.0.0')