from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import base64
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
port = os.getenv('PORT', 5000)  # Default to 5000 if not set in .env

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
        data = request.json  # Get JSON data
        image_data = data.get("image")  # Extract Base64 image

        if not image_data:
            return jsonify({"error": "No image received"}), 400

        # Remove the metadata prefix (if present)
        image_data = re.sub(r"^data:image\/\w+;base64,", "", image_data)

        # Decode Base64 image
        image_bytes = base64.b64decode(image_data)
        file_path = "robot_capture.png"

        # Save the image
        with open(file_path, "wb") as image_file:
            image_file.write(image_bytes)

        print(f"Image saved successfully at {file_path}")

        return jsonify({"message": "Image received and saved", "file_path": file_path})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=int(port))
