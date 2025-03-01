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
import torch
from ultralytics import YOLO
import time
current_time = time.time()


# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Enable WebSocket support
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Connect to Google Colab WebSocket

colab_socket = PSocketIO.Client()

COLAB_WS_URL = "wss://c543-35-194-171-141.ngrok-free.app/socket.io/"

try:
    colab_socket.connect(COLAB_WS_URL)
    print(f"✅ Connected to Google Colab WebSocket at {COLAB_WS_URL}")
except Exception as e:
    print(f"❌ Failed to connect to Colab WebSocket: {e}")


app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')
port = os.getenv('PORT', 5001)

# Load YOLOv11m model
# model_path = os.getenv("YOLO_MODEL_PATH", "YOLOv11+keys/best.pt")  # Set in .env or use default
# model = YOLO('YOLOv11+keys/best.pt')  # Load the YOLO model once

#Load Pre-trained YOLOv8 Model (Base Model)
model = YOLO("yolov8m.pt")  # Loads a standard model instead of the custom trained model

# Print available class names for debugging
# print("Loaded YOLO Model Class Names:", model.names)

# Store last YOLO processing time to throttle requests
last_yolo_time = 0
YOLO_INTERVAL = 1  # Process YOLO every 1 second

@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config['SECRET_KEY'],
        'port': port
    }
@app.route('/send_test', methods=['GET'])
def send_test_message():
    """ Sends a test message to the Google Colab WebSocket """
    try:
        colab_socket.emit("test_message", {"data": "Hello from Flask!"})
        return jsonify({"message": "Test message sent to Colab WebSocket"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/object-positions", methods=["POST"])
def receive_object_positions():
    global object_positions
    data = request.get_json()
    object_positions = data.get("objectPositions", [])
    print("Object Positions Successful")
    return jsonify({"message": "Object positions received", "data": object_positions})


# WebSocket Event Handlers
@socketio.on('connect')
def handle_connect():
    print("🟢 Client connected via WebSocket")

@socketio.on('disconnect')
def handle_disconnect():
    print("🔴 Client disconnected")

import base64
import cv2

@socketio.on('send_frame')
def handle_image_stream(data):
    """ Handles incoming image frames over WebSockets with throttling """
    global last_yolo_time
    try:
        print("📥 Received image frame")
        image_data = data.get("image")
        robot_position = data.get("position")
        robot_rotation = data.get("rotation")
        collision_Indicator = data.get("collisionIndicator")

        if not image_data:
            print("❌ No image received")
            return
        
        print(f"📍 Position: {robot_position}")
        print(f"🔄 Rotation: {robot_rotation}")

        # Use built-in time module instead of eventlet.time
        current_time = time.time()
        if current_time - last_yolo_time < YOLO_INTERVAL:
            print("⏳ Skipping YOLO processing (Throttled)")
            return

        last_yolo_time = current_time  # Update last processed time

        # Decode Base64 image
        image_data = re.sub(r"^data:image\/\w+;base64,", "", image_data)
        image_bytes = base64.b64decode(image_data)

        # Convert image bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Convert image to NumPy array
        image_array = np.array(image)

        # Encode the image array back into Base64 (for sending to Colab)
        _, buffer = cv2.imencode('.png', cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR))
        image_base64 = base64.b64encode(buffer).decode('utf-8')

        # Run YOLO inference
        results = model(image_array)

        # Extract detections
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy.tolist()[0]
                conf = box.conf.tolist()[0]
                cls = int(box.cls.tolist()[0])
                class_name = model.names.get(cls, "Unknown")

                print(f"🎯 Detected: {class_name} (Confidence: {conf:.2f})")

                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf,
                    "class_id": cls,
                    "class_name": class_name
                })

        # Create JSON payload
        json_payload = {
            "robot_position": robot_position,
            "robot_rotation": robot_rotation,
            "collision_indicator": collision_Indicator,
            "detections": detections,
            "image": image_base64  # Send Base64 encoded image to Colab
        }

        # Send detection results to the frontend
        socketio.emit('detection_results', json_payload)

        # Send the same JSON payload to Google Colab
        try:
            colab_socket.emit("detection_data", json_payload)
            print("✅ Sent detection data + image to Google Colab")
        except Exception as e:
            print(f"❌ Failed to send data to Colab: {e}")

    except Exception as e:
        print("❌ Error processing image:", e)
        socketio.emit('detection_results', {"error": str(e)})



if __name__ == '__main__':
    print(f"🚀 Running Flask WebSocket Server on port {port}")
    socketio.run(app, debug=True, port=int(port), host='0.0.0.0')