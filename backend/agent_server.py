from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import torch
import os
import time
import json
import logging
from datetime import datetime

# Import your DQNAgent
from dqn_agent import DQNAgent  # Make sure this path is correct

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants (should match your frontend ACTIONS)
ACTIONS = ['w', 'a', 's', 'd', 'v']
STATE_SIZE = 16  # Update based on your state representation
ACTION_SIZE = len(ACTIONS)

# Initialize global agent
agent = None

def initialize_agent():
    """Initialize the DQNAgent"""
    global agent
    
    # Create directories if they don't exist
    os.makedirs('models', exist_ok=True)
    os.makedirs('stats', exist_ok=True)
    
    # Initialize agent
    agent = DQNAgent(
        state_size=STATE_SIZE,
        action_size=ACTION_SIZE
    )
    
    # Load latest model if it exists
    model_files = [f for f in os.listdir('models') if f.endswith('.pth')]
    if model_files:
        latest_model = max(model_files, key=lambda f: os.path.getctime(os.path.join('models', f)))
        try:
            agent.load(os.path.join('models', latest_model))
            logger.info(f"Loaded model from {latest_model}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    
    return agent

# API Routes

@app.route('/api/state', methods=['POST'])
def process_state():
    """Process robot state and return next action"""
    global agent
    
    # Initialize agent if needed
    if agent is None:
        agent = initialize_agent()
    
    # Get request data
    data = request.json
    
    # Convert state for agent
    state = agent.get_state_representation(data)
    
    # Select action based on state
    # During training, let agent use epsilon-greedy
    # During inference, use greedy policy
    is_training = data.get('is_training', False)
    action_index = agent.select_action(state, evaluation=not is_training)
    action = ACTIONS[action_index]
    
    # Return action to robot
    return jsonify({
        "action": action,
        "action_index": action_index,
        "epsilon": agent.epsilon
    })

@app.route('/api/outcome', methods=['POST'])
def process_outcome():
    """Process the outcome of an action"""
    global agent
    
    # Initialize agent if needed
    if agent is None:
        agent = initialize_agent()
    
    # Get request data
    data = request.json
    
    # Extract data
    action = data.get('action', 'w')
    action_index = ACTIONS.index(action) if action in ACTIONS else 0
    reward = data.get('reward', 0)
    old_state_data = data.get('old_state', {})
    new_state_data = data.get('new_state', {})
    done = data.get('done', False)
    
    # Convert state representations
    old_state = agent.get_state_representation(old_state_data)
    new_state = agent.get_state_representation(new_state_data)
    
    # Add experience to replay memory
    agent.memory.add(old_state, action_index, reward, new_state, done)
    
    # If we're training, update the network
    is_training = data.get('is_training', False)
    if is_training and len(agent.memory) >= 32:  # Minimum batch size
        agent.update_network()
    
    return jsonify({
        "status": "success",
        "done": done
    })

@app.route('/api/train', methods=['POST'])
def start_training():
    """Start or stop agent training mode"""
    global agent
    
    # Initialize agent if needed
    if agent is None:
        agent = initialize_agent()
    
    # Get request data
    data = request.json
    start = data.get('start', True)
    
    if start:
        agent.is_training = True
        logger.info("Agent set to training mode")
    else:
        agent.is_training = False
        
        # Save the model when stopping training
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = os.path.join('models', f'dqn_agent_{timestamp}.pth')
        agent.save(model_path)
        logger.info(f"Agent set to inference mode, model saved to {model_path}")
    
    return jsonify({
        "status": "success",
        "is_training": agent.is_training
    })

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get agent metrics"""
    global agent
    
    if agent is None:
        return jsonify({
            "error": "Agent not initialized"
        }), 400
    
    # Gather metrics
    metrics = {
        "loss": agent.loss_history[-1] if agent.loss_history else 0,
        "epsilon": agent.epsilon,
        "rewards": agent.episode_rewards[-100:] if agent.episode_rewards else [],
        "steps_done": agent.steps_done,
        "memory_size": len(agent.memory),
        "is_training": getattr(agent, 'is_training', False)
    }
    
    return jsonify(metrics)

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get server status"""
    global agent
    
    return jsonify({
        "status": "running",
        "agent_initialized": agent is not None,
        "memory_size": len(agent.memory) if agent else 0,
        "is_training": getattr(agent, 'is_training', False),
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# Start the server when running directly
if __name__ == "__main__":
    logger.info("Starting HTTP server on port 5001...")
    app.run(host='0.0.0.0', port=5001)