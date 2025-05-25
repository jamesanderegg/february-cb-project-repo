from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import json
import time
import threading

import io
from PIL import Image
from ultralytics import YOLO  # or your specific detection method


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "defaultsecret")
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")
# Load your YOLO model once
YOLO_MODEL = YOLO("YOLO/best.pt") 

# Directory for saving replays
REPLAYS_DIR = "replays"
os.makedirs(REPLAYS_DIR, exist_ok=True)

# Global variables to manage replay state
current_replay = None
replay_thread = None
replay_running = False

@app.route("/hello")
def hello():
    return {"message": "Flask is working!"}

@socketio.on('connect')
def on_connect():
    print("Client connected")
    emit('connected', {'msg': 'You are connected!'})

@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected")
    # Make sure to stop any ongoing replay when client disconnects
    stop_replay_thread()

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
        files = [
            f for f in os.listdir(REPLAYS_DIR)
            if f.endswith('.json') and not f.endswith('.obj.json')
        ]
        return jsonify({"replays": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Stop any running replay thread
def stop_replay_thread():
    global replay_running, replay_thread
    
    if replay_thread and replay_thread.is_alive():
        replay_running = False
        replay_thread.join(timeout=1.0)
        print("Replay stopped")
    
    replay_thread = None

# ✅ Socket handler for starting a replay
@socketio.on('start_replay')
def handle_start_replay(data):  # Changed function name and added data parameter
    print("Socket start_replay received!")
    filename = data.get('filename')  # Changed from request.json to data
    
    if not filename:
        emit('replay_status', {'status': 'error', 'message': 'No filename provided'})
        return

    # Load the main replay file
    filepath = os.path.join(REPLAYS_DIR, filename)  # Use REPLAYS_DIR instead of replay_memory.save_dir
    if not os.path.exists(filepath):
        emit('replay_status', {'status': 'error', 'message': 'File not found'})
        return

    try:
        with open(filepath, 'r') as f:
            replay_data = json.load(f)

        # Load the matching .obj.json file
        base_name = os.path.splitext(filename)[0]
        object_file = os.path.join(REPLAYS_DIR, f"{base_name}.obj.json")
        object_data = None

        try:
            with open(object_file, 'r') as f:
                object_data = json.load(f)
                print(f"📦 Loaded object positions from {object_file}")
        except FileNotFoundError:
            print(f"⚠️ No object file found for {filename}")
        except Exception as e:
            print(f"❌ Error reading object file: {str(e)}")

        # Emit replay data with object positions
        emit('replay_data', {
            'frames': replay_data,
            'object_data': object_data
        })

    except Exception as e:
        emit('replay_status', {'status': 'error', 'message': str(e)})

@app.route('/replays/<filename>', methods=['GET'])
def get_object_metadata(filename):
    if not filename.endswith('.obj.json'):
        return jsonify({"status": "error", "message": "Invalid object metadata file requested"}), 400

    filepath = os.path.join(REPLAYS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"status": "error", "message": "Object metadata file not found"}), 404

    try:
        with open(filepath, "r") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ✅ Socket handler for stopping a replay
@socketio.on('stop_replay')
def handle_stop_replay():
    global current_replay
    
    replay_name = current_replay
    stop_replay_thread()
    current_replay = None
    
    emit('replay_status', {'status': 'stopped', 'filename': replay_name})
    print(f"Stopped replay: {replay_name}")

@app.route('/yolo_predict', methods=['POST'])
def yolo_predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    image_bytes = file.read()

    try:
        print("📥 YOLO image received")
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        results = YOLO_MODEL(image)

        detected_labels = []
        for result in results:
            names = result.names
            boxes = getattr(result, 'boxes', None)

            if boxes:
                for box in boxes:
                    try:
                        class_id = int(box.cls[0].item()) if hasattr(box.cls[0], 'item') else int(box.cls[0])
                        label = names.get(class_id, f"class_{class_id}")
                        detected_labels.append(label)
                    except Exception as e:
                        print("⚠️ Box parse error:", e)

        print("✅ Detected:", detected_labels)
        return jsonify({'detectedObjects': detected_labels})

    except Exception as e:
        print("❌ YOLO processing failed:", str(e))
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)