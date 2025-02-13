from flask import Flask, request, jsonify
import cv2
import numpy as np
import torch

app = Flask(__name__)

# Load YOLOv11m model
# model from Ultralytics 
# keys dataSet curated using images from Pixabay--bb created using roboflow--model trained on Google Colab
model = torch.hub.load('ultralytics/yolov11m', 'custom', path='backend/YOLOv11+keys/best.pt')

@app.route('/detect', methods=['POST'])
def detect_objects():
    # Get the image from the request
    file = request.files['image']
    img_bytes = file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    # Perform inference with the YOLO model
    results = model(img)

    # Get the results
    detections = results.pandas().xywh[0].to_dict(orient="records")  # list of dicts with object info

    # Return the detection results as JSON
    return jsonify(detections)

if __name__ == '__main__':
    app.run(debug=True)
