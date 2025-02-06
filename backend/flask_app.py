from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for now
 

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
port = os.getenv('PORT', 5000)  # Default to 5000 if not set in .env

@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config['SECRET_KEY'],
        'port': port
    }

if __name__ == '__main__':
    app.run(debug=True, port=int(port))
