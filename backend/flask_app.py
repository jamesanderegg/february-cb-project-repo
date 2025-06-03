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
from ultralytics import YOLO

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "defaultsecret")
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# YOLO model
YOLO_MODEL = YOLO("YOLO/best.pt")

# Google Drive setup
SERVICE_ACCOUNT_FILE = 'credentials/googleCredentials.json'
SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", None)

def get_drive_service():
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def upload_to_drive(filename, json_data):
    drive_service = get_drive_service()
    file_metadata = {
        'name': filename,
        'mimeType': 'application/json'
    }
    if DRIVE_FOLDER_ID:
        file_metadata['parents'] = [DRIVE_FOLDER_ID]

    memfile = io.BytesIO(json.dumps(json_data).encode('utf-8'))
    media = MediaIoBaseUpload(memfile, mimetype='application/json')
    uploaded = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    return uploaded

def download_from_drive(filename):
    drive_service = get_drive_service()
    results = drive_service.files().list(q=f"name='{filename}'", fields="files(id, name)").execute()
    files = results.get("files", [])

    if not files:
        raise FileNotFoundError(f"{filename} not found in Google Drive")

    file_id = files[0]['id']
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()

    fh.seek(0)
    return json.load(fh)

# === Replay State ===
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
    stop_replay_thread()

def stop_replay_thread():
    global replay_running, replay_thread
    if replay_thread and replay_thread.is_alive():
        replay_running = False
        replay_thread.join(timeout=1.0)
        print("Replay stopped")
    replay_thread = None

@app.route('/save_replay', methods=['POST'])
def save_replay():
    content = request.get_json()
    filename = content.get("filename")
    data = content.get("data")

    if not filename or not data:
        return jsonify({"status": "error", "message": "Missing filename or data"}), 400

    try:
        uploaded = upload_to_drive(filename, data)
        return jsonify({"status": "success", "file_id": uploaded['id']})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/list_replays', methods=['GET'])
def list_replays():
    try:
        drive_service = get_drive_service()
        query = f"'{DRIVE_FOLDER_ID}' in parents" if DRIVE_FOLDER_ID else "mimeType='application/json'"
        results = drive_service.files().list(q=query, fields="files(name)").execute()
        files = [f["name"] for f in results.get('files', []) if f["name"].endswith(".json") and not f["name"].endswith(".obj.json")]
        return jsonify({"replays": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@socketio.on('start_replay')
def handle_start_replay(data):
    print("Socket start_replay received!")
    filename = data.get('filename')

    if not filename:
        emit('replay_status', {'status': 'error', 'message': 'No filename provided'})
        return

    try:
        replay_data = download_from_drive(filename)

        object_data = None
        base_name = os.path.splitext(filename)[0]
        obj_filename = f"{base_name}.obj.json"

        try:
            object_data = download_from_drive(obj_filename)
            print(f"📦 Loaded object positions from {obj_filename}")
        except FileNotFoundError:
            print(f"⚠️ No object file found for {filename}")
        except Exception as e:
            print(f"❌ Error reading object file: {str(e)}")

        emit('replay_data', {
            'frames': replay_data,
            'object_data': object_data
        })

    except Exception as e:
        emit('replay_status', {'status': 'error', 'message': str(e)})

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

        return jsonify({'detectedObjects': detected_labels})

    except Exception as e:
        print("❌ YOLO processing failed:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/replays/<filename>', methods=['GET'])
def get_object_metadata(filename):
    if not filename.endswith('.obj.json'):
        return jsonify({"status": "error", "message": "Invalid object metadata file requested"}), 400

    try:
        data = download_from_drive(filename)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "Object metadata file not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
