from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import socketio as PSocketIO
from dotenv import load_dotenv
import os
import base64
import re
import io
import numpy as np
from PIL import Image
from ultralytics import YOLO
import time
import threading

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Enable WebSocket support
socketio = SocketIO(app, cors_allowed_origins="*", logger=False, engineio_logger=False)

# Connect to Google Colab WebSocket
colab_socket = PSocketIO.Client()
COLAB_WS_URL = "wss://4c7e-35-185-17-110.ngrok-free.app/socket.io/"
try:
    colab_socket.connect(COLAB_WS_URL, namespaces=["/"])
    print(f"✅ Connected to Google Colab WebSocket at {COLAB_WS_URL}")
except Exception as e:
    print(f"❌ Failed to connect to Colab WebSocket: {e}")

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')
port = os.getenv('PORT', 5001)

# Load YOLOv8 model
model = YOLO("yolov8m.pt")

# Global variables for throttling
last_yolo_time = 0
YOLO_INTERVAL = 1  # in seconds

@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config['SECRET_KEY'],
        'port': port
    }

@app.route('/send_test', methods=['GET'])
def send_test_message():
    try:
        colab_socket.emit("test_message", {"data": "Hello from Flask!"})
        return jsonify({"message": "Test message sent to Colab WebSocket"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/object-positions", methods=["POST"])
def receive_object_positions():
    data = request.get_json()
    object_positions = data.get("objectPositions", [])
    print("✅ Object Positions Received:", object_positions)
    if not colab_socket.connected:
        print("❌ Colab WebSocket is NOT connected! Attempting to reconnect...")
        try:
            colab_socket.connect(COLAB_WS_URL, namespaces=["/"])
            print("✅ Reconnected to Colab WebSocket")
        except Exception as e:
            print(f"❌ Reconnection failed: {e}")
            return jsonify({"error": "Failed to reconnect to Colab"}), 500
    try:
        colab_socket.emit("object_positions", {"objectPositions": object_positions}, namespace="/")
        print("✅ Sent object positions to Google Colab")
    except Exception as e:
        print(f"❌ Failed to send object positions to Colab: {e}")
    return jsonify({"message": "Object positions received and sent to Colab", "data": object_positions})

@socketio.on('connect')
def handle_connect():
    print("🟢 Client connected via WebSocket")

@socketio.on('disconnect')
def handle_disconnect():
    print("🔴 Client disconnected")

@socketio.on('send_frame')
def handle_image_stream(data):
    global last_yolo_time
    try:
        capture_timestamp = data.get("timestamp")
        receive_timestamp = time.time() * 1000  # convert to ms for consistency

        image_data = data.get("image")
        robot_position = data.get("position")
        robot_rotation = data.get("rotation")
        collision_indicator = data.get("collisionIndicator")

        if not image_data:
            print("❌ No image received")
            return

        current_time = time.time()
        if current_time - last_yolo_time < YOLO_INTERVAL:
            print("⏳ Skipping YOLO processing (Throttled)")
            return

        last_yolo_time = current_time

        # Process image (handle binary/Base64 as before)
        if isinstance(image_data, bytes):
            image_bytes = image_data
        else:
            image_data = re.sub(r"^data:image\/\w+;base64,", "", image_data)
            image_bytes = base64.b64decode(image_data)

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(image)

        # Pass the original capture timestamp to the background task
        data["capture_timestamp"] = capture_timestamp
        data["receive_timestamp"] = receive_timestamp

        socketio.start_background_task(process_yolo, image_array, data)

    except Exception as e:
        print("❌ Error processing image:", e)
        socketio.emit('detection_results', {"error": str(e)})

def process_yolo(image_array, original_data):
    global YOLO_INTERVAL
    start_time = time.time()
    
    results = model(image_array)
    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy.tolist()[0]
            conf = box.conf.tolist()[0]
            cls = int(box.cls.tolist()[0])
            class_name = model.names.get(cls, "Unknown")
            detections.append({
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "confidence": conf,
                "class_id": cls,
                "class_name": class_name
            })

    # Include timestamps in payload
    json_payload = {
        "robot_position": original_data.get("position"),
        "robot_rotation": original_data.get("rotation"),
        "collision_indicator": original_data.get("collisionIndicator"),
        "detections": detections,
        "capture_timestamp": original_data.get("capture_timestamp"),
        "receive_timestamp": original_data.get("receive_timestamp"),
        "yolo_complete_timestamp": time.time() * 1000,  # YOLO complete time in ms
    }

    socketio.emit('detection_results', json_payload)

    try:
        colab_socket.emit("detection_data", json_payload)
        print("✅ Sent detection data to Google Colab")
    except Exception as e:
        print(f"❌ Failed to send data to Colab: {e}")

    processing_time = time.time() - start_time
    if processing_time > 0.5:
        YOLO_INTERVAL = min(YOLO_INTERVAL * 1.1, 2.0)
    else:
        YOLO_INTERVAL = max(YOLO_INTERVAL * 0.9, 0.1)

# Import the ReplayCollector
from replay_collector import ReplayCollector

# Initialize the replay collector
replay_collector = ReplayCollector(save_dir='experiences')

# Socket handler for replay control
@socketio.on("replay_control")
def handle_replay_control(data):
    """Handle replay control commands from the client"""
    command = data.get('command', '')
    
    if command == 'start':
        # Start recording replay
        replay_collector.start_recording()
        socketio.emit("replay_status", {
            "status": "recording", 
            "episode": replay_collector.episode_count + 1
        })
    
    elif command == 'stop':
        # Stop recording replay
        replay_collector.stop_recording()
        socketio.emit("replay_status", {
            "status": "stopped", 
            "episode": replay_collector.episode_count
        })
    
    elif command == 'save':
        # Save current replay buffer
        filename = data.get('filename', f'replay_{int(time.time())}.json')
        saved_path = replay_collector.save_episodes(filename)
        if saved_path:
            socketio.emit("replay_status", {
                "status": "saved",
                "episodes": replay_collector.episode_count,
                "steps": sum(len(ep) for ep in replay_collector.episodes),
                "filename": os.path.basename(saved_path)
            })
    
    elif command == 'load':
        # Load replay from file
        filename = data.get('filename')
        background = data.get('background', False)
        if filename:
            # Start loading in a background thread to prevent blocking
            threading.Thread(
                target=replay_collector.load_episodes,
                args=(filename, background, socketio)
            ).start()
    
    elif command == 'replay':
        # Add replay data to agent memory
        if 'agent' in globals():
            count = replay_collector.replay_to_memory(agent)
            socketio.emit("replay_status", {
                "status": "replayed",
                "experiences": count
            })
        else:
            socketio.emit("replay_status", {
                "status": "error",
                "message": "Agent not initialized"
            })
    
    elif command == 'get_screen':
        # Get a specific screen by ID
        screen_id = data.get('screen_id')
        if screen_id:
            screen_data = replay_collector.get_screen(screen_id)
            if screen_data:
                socketio.emit("replay_screen", screen_data)
            else:
                socketio.emit("replay_status", {
                    "status": "error",
                    "message": f"Screen not found: {screen_id}"
                })
    
    elif command == 'preload_screens':
        # Preload nearby screens for smoother playback
        current_screen = data.get('current_screen')
        count = data.get('count', 5)
        if current_screen:
            preloaded = replay_collector.preload_screens(current_screen, count)
            # Send each preloaded screen to the client
            for screen_id in preloaded:
                screen_data = replay_collector.get_screen(screen_id)
                if screen_data:
                    socketio.emit("replay_screen", screen_data)
            
            socketio.emit("replay_status", {
                "status": "preloaded",
                "count": len(preloaded)
            })
    
    elif command == 'list_replays':
        # List available replays
        try:
            replay_files = []
            for filename in os.listdir(replay_collector.save_dir):
                if filename.endswith('.json'):
                    # Get file stats
                    file_path = os.path.join(replay_collector.save_dir, filename)
                    file_size = os.path.getsize(file_path)
                    
                    # Try to load the file to get episode count
                    try:
                        with open(file_path, 'r') as f:
                            replay_data = json.load(f)
                        episode_count = len(replay_data.get('episodes', []))
                        step_count = sum(len(ep.get('steps', [])) for ep in replay_data.get('episodes', []))
                    except:
                        episode_count = 0
                        step_count = 0
                    
                    replay_files.append({
                        'filename': filename,
                        'episodes': episode_count,
                        'steps': step_count,
                        'size': file_size,
                        'creation_time': os.path.getctime(file_path)
                    })
            
            # Sort by creation time (newest first)
            replay_files.sort(key=lambda x: x['creation_time'], reverse=True)
            
            socketio.emit('replay_status', {
                'status': 'available_replays',
                'replays': replay_files
            })
        except Exception as e:
            socketio.emit('replay_status', {
                'status': 'error',
                'message': f"Error listing replays: {str(e)}"
            })

# Socket handler for training control
@socketio.on('training_control')
def handle_training_control(data):
    """Handle training control commands from the client"""
    global agent  # Access the global agent variable
    
    command = data.get('command')
    
    if command == 'start_training':
        # Start training on loaded replay data
        episodes = data.get('episodes', 10)
        batch_size = data.get('batch_size', 32)
        
        # Check if agent exists
        if 'agent' not in globals() or agent is None:
            socketio.emit('training_status', {
                'status': 'error',
                'message': 'Agent not initialized'
            })
            return
        
        # Start training in a background thread
        threading.Thread(
            target=start_training_thread,
            args=(agent, episodes, batch_size, socketio)
        ).start()
    
    elif command == 'stop_training':
        # Signal to stop training
        if 'agent' in globals() and agent is not None:
            agent.stop_training_flag = True
            socketio.emit('training_status', {
                'status': 'stopping'
            })
        else:
            socketio.emit('training_status', {
                'status': 'error',
                'message': 'Agent not initialized'
            })
    
    elif command == 'save_model':
        # Save the current model
        if 'agent' in globals() and agent is not None:
            filename = data.get('filename', f'model_{int(time.time())}.pth')
            
            # Make sure model directory exists
            model_dir = 'models'
            os.makedirs(model_dir, exist_ok=True)
            
            model_path = os.path.join(model_dir, filename)
            
            try:
                agent.save(model_path)
                socketio.emit('training_status', {
                    'status': 'saved',
                    'filename': filename,
                    'path': model_path
                })
            except Exception as e:
                socketio.emit('training_status', {
                    'status': 'error',
                    'message': f'Failed to save model: {str(e)}'
                })
        else:
            socketio.emit('training_status', {
                'status': 'error',
                'message': 'Agent not initialized'
            })
    
    elif command == 'load_model':
        # Load a saved model
        if 'agent' in globals() and agent is not None:
            filename = data.get('filename')
            if filename:
                model_dir = 'models'
                model_path = os.path.join(model_dir, filename)
                
                if os.path.exists(model_path):
                    try:
                        agent.load(model_path)
                        socketio.emit('training_status', {
                            'status': 'loaded',
                            'filename': filename
                        })
                    except Exception as e:
                        socketio.emit('training_status', {
                            'status': 'error',
                            'message': f'Failed to load model: {str(e)}'
                        })
                else:
                    socketio.emit('training_status', {
                        'status': 'error',
                        'message': f'Model file not found: {filename}'
                    })
        else:
            socketio.emit('training_status', {
                'status': 'error',
                'message': 'Agent not initialized'
            })

def start_training_thread(agent, episodes, batch_size, socketio):
    """Background thread to run training and emit progress updates"""
    
    try:
        # Reset stop flag
        agent.stop_training_flag = False
        
        # Emit initial status
        socketio.emit('training_status', {
            'status': 'training',
            'progress': 0
        })
        
        # Check if we have enough samples
        if len(agent.memory) < batch_size:
            socketio.emit('training_status', {
                'status': 'error',
                'message': f'Not enough samples in memory. Need {batch_size}, have {len(agent.memory)}'
            })
            return
        
        # Train for specified number of episodes
        for episode in range(episodes):
            if getattr(agent, 'stop_training_flag', False):
                # Training was stopped by user
                socketio.emit('training_status', {
                    'status': 'stopped',
                    'progress': (episode / episodes) * 100
                })
                return
            
            # Train on a batch
            stats = agent.train_batch(batch_size)
            
            # Calculate progress
            progress = ((episode + 1) / episodes) * 100
            
            # Emit progress update
            socketio.emit('training_status', {
                'status': 'training',
                'progress': progress,
                'episode': episode + 1,
                'total_episodes': episodes
            })
            
            # Emit training stats
            socketio.emit('training_stats', {
                'episodes': episode + 1,
                'loss': stats.get('loss', 0),
                'avg_reward': stats.get('avg_reward', 0),
                'epsilon': stats.get('epsilon', 0)
            })
            
            # Sleep briefly to avoid socketio flooding
            time.sleep(0.01)
        
        # Save metrics after training
        if hasattr(agent, 'save_metrics'):
            agent.save_metrics()
        
        # Training completed successfully
        socketio.emit('training_status', {
            'status': 'completed',
            'episodes': episodes
        })
        
    except Exception as e:
        # Handle training errors
        socketio.emit('training_status', {
            'status': 'error',
            'message': str(e)
        })
if __name__ == '__main__':
    print(f"🚀 Running Flask WebSocket Server on port {port}")
    socketio.run(app, debug=True, port=int(port), host='0.0.0.0')
