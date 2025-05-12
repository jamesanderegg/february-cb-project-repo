from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "defaultsecret")
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

# Directory for saving replays
REPLAYS_DIR = "replays"
os.makedirs(REPLAYS_DIR, exist_ok=True)

@app.route("/hello")
def hello():
    return {"message": "Flask is working!"}

@socketio.on('connect')
def on_connect():
    print("Client connected")
    emit('connected', {'msg': 'You are connected!'})

# ✅ Save a replay to disk
@app.route('/save_replay', methods=['POST'])
def save_replay():
    content = request.get_json()
    filename = content.get("filename")
    data = content.get("data")

    if not filename or not data:
        return jsonify({"status": "error", "message": "Missing filename or data"}), 400

    filepath = os.path.join(REPLAYS_DIR, filename)
    try:
        with open(filepath, "w") as f:
            json.dump(data, f)
        return jsonify({"status": "success", "filename": filename})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ✅ List all replay filenames
@app.route('/list_replays', methods=['GET'])
def list_replays():
    try:
        files = [f for f in os.listdir(REPLAYS_DIR) if f.endswith('.json')]
        return jsonify({"replays": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
