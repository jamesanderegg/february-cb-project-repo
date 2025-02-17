from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import base64
import re
import io
import numpy as np
from PIL import Image
import torch
from ultralytics import YOLO

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
port = os.getenv('PORT', 5000)

# Load YOLOv11m model
model_path = os.getenv("YOLO_MODEL_PATH", "path/to/your/yolov11m.pt")  # Set in .env or use default
model = YOLO(model_path)  # Load the YOLO model once

@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config['SECRET_KEY'],
        'port': port
    }

@app.route('/robot', methods=['POST'])
def robot():
    try:
        data = request.json
        image_data = data.get("image")

        if not image_data:
            return jsonify({"error": "No image received"}), 400

        # Debugging: Print first few characters of the image
        print("Received Base64 Data:", image_data[:100])

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
                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf, "class": cls
                })

        return jsonify({
            "message": "Image received and processed",
            "detections": detections
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=int(port))
