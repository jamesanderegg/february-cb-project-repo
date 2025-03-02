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

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Enable WebSocket support
socketio = SocketIO(app, cors_allowed_origins="*", logger=False, engineio_logger=False)

# Connect to Google Colab WebSocket
colab_socket = PSocketIO.Client()
COLAB_WS_URL = "wss://ce0d-34-46-74-240.ngrok-free.app/socket.io/"
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

if __name__ == '__main__':
    print(f"🚀 Running Flask WebSocket Server on port {port}")
    socketio.run(app, debug=True, port=int(port), host='0.0.0.0')
