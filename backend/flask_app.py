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
import eventlet

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Enable WebSocket support
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Connect to Google Colab WebSocket

colab_socket = PSocketIO.Client()

COLAB_WS_URL = "wss://e230-34-83-86-78.ngrok-free.app/socket.io/"

try:
    colab_socket.connect(COLAB_WS_URL)
    print(f"✅ Connected to Google Colab WebSocket at {COLAB_WS_URL}")
except Exception as e:
    print(f"❌ Failed to connect to Colab WebSocket: {e}")


app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')
port = os.getenv('PORT', 5000)

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
    
@app.route('/robot', methods=['POST'])
def robot():
    print('Start robot')
    try:
        data = request.json
        image_data = data.get("image")
        robot_position = data.get("position")  # Extract position
        robot_rotation = data.get("rotation")  # Extract rotation
        collision_Indicator = data.get("collisionIndicator")  # Extract rotation
        if not image_data:
            return jsonify({"error": "No image received"}), 400

        if robot_position is None or robot_rotation is None:
            print("⚠️ Missing position or rotation data!")
            return jsonify({"error": "Missing robot position or rotation"}), 400

        print(f"📍 Robot Position: {robot_position}")
        print(f"🔄 Robot Rotation: {robot_rotation}")
        print(f"🔄 Collision: {collision_Indicator}")
        # Decode Base64 image
        image_data = re.sub(r"^data:image\/\w+;base64,", "", image_data)
        image_bytes = base64.b64decode(image_data)

        # Convert image bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((640, 640))  # Resize for YOLO input

        # Convert image to NumPy array for YOLO
        image_array = np.array(image)

        # Run YOLO inference
        results = model(image_array)

        # Extract detections
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy.tolist()[0]  # Bounding box coordinates
                conf = box.conf.tolist()[0]  # Confidence score
                cls = int(box.cls.tolist()[0])  # Class ID

                class_name = model.names.get(cls, "Unknown")  # Get class name

                print(f"🎯 Detected: {class_name} (Confidence: {conf:.2f})")

                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf,
                    "class_id": cls,
                    "class_name": class_name
                })

        return jsonify({
            "message": "Image received and processed",
            "position": robot_position,
            "rotation": robot_rotation,
            "collisionIndicator": collision_Indicator,
            "detections": detections
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/robot-data", methods=["POST"])
def receive_robot_data():
    global robot_data
    data = request.get_json()

    # Extract all fields
    robot_data = {
        "robotCamera": data.get("robotCamera", None),
        "robotPosition": data.get("robotPosition", {}),
        "robotRotation": data.get("robotRotation", {}),
        "YOLOdetectObject": data.get("YOLOdetectObject", [])
    }

    print("Received Robot Data:", robot_data)

    return jsonify({"message": "Robot data received", "data": robot_data}) 


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

@socketio.on('send_frame')
def handle_image_stream(data):
    """ Handles incoming image frames over WebSockets with throttling """
    global last_yolo_time
    try:
        print("📥 Received image frame")
        image_data = data.get("image")
        robot_position = data.get("position")  # Extract robot position
        robot_rotation = data.get("rotation")  # Extract robot rotation
        if not image_data:
            print("❌ No image received")
            return
# Debugging: Log received data
        print(f"📍 Position: {robot_position}")
        print(f"🔄 Rotation: {robot_rotation}")
        # Throttle YOLO processing to every 1 second
        current_time = eventlet.time.time()
        if current_time - last_yolo_time < YOLO_INTERVAL:
            print("⏳ Skipping YOLO processing (Throttled)")
            return

        last_yolo_time = current_time  # Update last processed time

        # Decode Base64 image
        image_data = re.sub(r"^data:image\/\w+;base64,", "", image_data)
        image_bytes = base64.b64decode(image_data)

        # Convert image bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # print(f"🖼️ Image Size: {image.size}")

        # Convert image to NumPy array
        image_array = np.array(image)
        # print(f"📊 Image Shape: {image_array.shape}")

        # Run YOLO inference
        results = model(image_array)
        # print("⚡ YOLO Inference Complete")

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

        # Send detection results to client
        socketio.emit('detection_results', {"detections": detections})
        # print("📤 Sent detection results")

    except Exception as e:
        print("❌ Error processing image:", e)
        socketio.emit('detection_results', {"error": str(e)})

if __name__ == '__main__':
    print(f"🚀 Running Flask WebSocket Server on port {port}")
    socketio.run(app, debug=True, port=int(port), host='0.0.0.0')