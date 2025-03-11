from flask import Flask
from flask_cors import CORS

from dotenv import load_dotenv
import os



load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


port = os.getenv('PORT', 5001)


@app.route('/')
def home():
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config['SECRET_KEY'],
        'port': port
    }    

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')