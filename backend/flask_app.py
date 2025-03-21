from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import math
import threading
import asyncio
import nest_asyncio
from websockets.server import serve
import json
import torch
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Apply nest_asyncio to enable asyncio in Flask
nest_asyncio.apply()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Get port from environment variables
port = os.getenv('PORT', 5001)
ws_port = os.getenv('WS_PORT', 8765)

# Global variables for agent and WebSocket server
agent = None
ws_server = None
clients = set()

# Create a new event loop for the WebSocket server
ws_loop = asyncio.new_event_loop()

# WebSocket message handler
async def handle_websocket(websocket):
    """Handle WebSocket connections and messages"""
    global clients, agent
    
    # Register client
    clients.add(websocket)
    logger.info(f"New WebSocket client connected. Total clients: {len(clients)}")
    
    try:
        async for message in websocket:
            try:
                # Parse incoming message
                data = json.loads(message)
                msg_type = data.get('type')
                
                if msg_type == 'state':
                    # Process state data and get action from agent
                    response = await process_state(data, agent)
                    await websocket.send(json.dumps(response))
                
                elif msg_type == 'outcome':
                    # Process action outcome
                    response = await process_outcome(data, agent)
                    await websocket.send(json.dumps(response))
                
                elif msg_type == 'command':
                    # Handle commands like start/stop training
                    response = await process_command(data, agent)
                    await websocket.send(json.dumps(response))
                
                else:
                    # Unknown message type
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': f'Unknown message type: {msg_type}'
                    }))
            except json.JSONDecodeError:
                logger.error("Received invalid JSON")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'error': 'Invalid JSON format'
                }))
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'error': str(e)
                }))
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {str(e)}")
    finally:
        # Unregister client on disconnect
        clients.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(clients)}")

async def process_state(data, agent):
    """Process state data and get action from agent"""
    if agent is None:
        return {
            'type': 'error',
            'error': 'Agent not initialized'
        }
    
    # Normalize data for agent
    normalized_data = {
        'robot_position': data.get('robot_pos', [0, 0, 0]),
        'robot_rotation': data.get('robot_rot', [0, 0, 0, 1]),
        'collision_indicator': data.get('collision', False),
        'detections': data.get('detectedObjects', []),
        'time_left': data.get('time_left', 500),
        'target_object': data.get('target_object', None),
        'objects_in_view': data.get('objectsInViewRef', [])
    }
    
    # Use agent to select action
    action_info = agent.process_state_and_select_action(normalized_data)
    
    # Return response
    return {
        'type': 'action',
        'action': action_info['action'],
        'action_index': action_info['action_index'],
        'epsilon': action_info['epsilon'],
        'is_training': action_info['is_training']
    }

async def process_outcome(data, agent):
    """Process action outcome data"""
    if agent is None:
        return {
            'type': 'error',
            'error': 'Agent not initialized'
        }
    
    # Normalize old state
    old_state = data.get('old_state', {})
    old_state_normalized = {
        'robot_position': old_state.get('robot_pos', [0, 0, 0]),
        'robot_rotation': old_state.get('robot_rot', [0, 0, 0, 1]),
        'collision_indicator': old_state.get('collision', False),
        'detections': old_state.get('detectedObjects', []),
        'time_left': old_state.get('time_left', 500),
        'target_object': old_state.get('target_object', None),
        'objects_in_view': old_state.get('objectsInViewRef', [])
    }
    
    # Normalize new state
    new_state = data.get('new_state', {})
    new_state_normalized = {
        'robot_position': new_state.get('robot_pos', [0, 0, 0]),
        'robot_rotation': new_state.get('robot_rot', [0, 0, 0, 1]),
        'collision_indicator': new_state.get('collision', False),
        'detections': new_state.get('detectedObjects', []),
        'time_left': new_state.get('time_left', 500),
        'target_object': new_state.get('target_object', None),
        'objects_in_view': new_state.get('objectsInViewRef', [])
    }
    
    # Process outcome with agent
    outcome_data = {
        'action': data.get('action', 'w'),
        'reward': data.get('reward', 0),
        'old_state': old_state_normalized,
        'new_state': new_state_normalized,
        'done': data.get('done', False)
    }
    
    # Process outcome with agent
    result = agent.process_outcome(outcome_data)
    
    # Return response
    return {
        'type': 'outcome_processed',
        'success': result['success'],
        'steps_done': result['steps_done'],
        'memory_size': result['memory_size'],
        'epsilon': result['epsilon']
    }

async def process_command(data, agent):
    """Process command data"""
    if agent is None:
        return {
            'type': 'error',
            'error': 'Agent not initialized'
        }
    
    command = data.get('command')
    
    if command == 'start_training':
        # Set agent to training mode
        agent.is_training = True
        logger.info("Agent training started")
        return {
            'type': 'command_result', 
            'command': command, 
            'success': True
        }
    
    elif command == 'stop_training':
        # Set agent to inference mode
        agent.is_training = False
        logger.info("Agent training stopped")
        return {
            'type': 'command_result', 
            'command': command, 
            'success': True
        }
    
    elif command == 'save_model':
        # Save agent model
        model_path = data.get('path', 'models/agent_model.pth')
        try:
            agent.save(model_path)
            logger.info(f"Agent model saved to {model_path}")
            return {
                'type': 'command_result', 
                'command': command, 
                'success': True, 
                'path': model_path
            }
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return {
                'type': 'command_result', 
                'command': command, 
                'success': False, 
                'error': str(e)
            }
    
    elif command == 'load_model':
        # Load agent model
        model_path = data.get('path', 'models/agent_model.pth')
        try:
            agent.load(model_path)
            logger.info(f"Agent model loaded from {model_path}")
            return {
                'type': 'command_result', 
                'command': command, 
                'success': True, 
                'path': model_path
            }
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return {
                'type': 'command_result', 
                'command': command, 
                'success': False, 
                'error': str(e)
            }
    
    else:
        return {
            'type': 'command_result', 
            'command': command, 
            'success': False, 
            'error': 'Unknown command'
        }

# Start WebSocket server
async def start_websocket_server():
    """Start the WebSocket server"""
    global ws_server
    
    host = '0.0.0.0'
    try:
        ws_server = await serve(handle_websocket, host, int(ws_port))
        logger.info(f"WebSocket server started at ws://{host}:{ws_port}")
        return ws_server
    except Exception as e:
        logger.error(f"Failed to start WebSocket server: {str(e)}")
        return None

# Function to run WebSocket server in a separate thread
def run_websocket_server():
    """Run the WebSocket server in the asyncio event loop"""
    global ws_loop
    
    asyncio.set_event_loop(ws_loop)
    ws_loop.run_until_complete(start_websocket_server())
    ws_loop.run_forever()

# Initialize the DQN agent
def initialize_agent():
    """Initialize the DQNAgent"""
    global agent
    
    try:
        # Import necessary modules
        from model import DQNModel, ReplayMemory
        from agent import DQNAgent
        
        # Constants for agent initialization
        STATE_SIZE = 15  # Update this based on your state representation
        ACTION_SIZE = 5  # w, a, s, d, v
        
        # Initialize agent
        agent = DQNAgent(STATE_SIZE, ACTION_SIZE)
        
        # Try to load a saved model if it exists
        model_path = os.path.join(os.getcwd(), "models", "agent_model.pth")
        if os.path.exists(model_path):
            try:
                agent.load(model_path)
                logger.info(f"Loaded agent model from {model_path}")
            except Exception as e:
                logger.warning(f"Could not load agent model: {str(e)}")
        
        logger.info("DQNAgent initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize agent: {str(e)}")
        return False

# Flask routes
@app.route('/')
def home():
    """Home endpoint"""
    return {
        'message': 'Flask API is working!',
        'secret_key': app.config.get('SECRET_KEY', 'no_key_set'),
        'port': port,
        'websocket_port': ws_port,
        'agent_status': 'initialized' if agent is not None else 'not initialized'
    }

@app.route('/status')
def status():
    """Status endpoint"""
    return jsonify({
        'status': 'ok',
        'agent_initialized': agent is not None,
        'websocket_running': ws_server is not None,
        'connected_clients': len(clients)
    })

@app.route('/metrics')
def metrics():
    """Get agent metrics"""
    if agent is None:
        return jsonify({
            'status': 'error',
            'message': 'Agent not initialized'
        }), 404
    
    # Get metrics from agent
    return jsonify({
        'status': 'ok',
        'loss': agent.loss_history[-1] if agent.loss_history else 0,
        'rewards': agent.episode_rewards[-10:] if hasattr(agent, 'episode_rewards') else [],
        'epsilon': agent.epsilon,
        'steps_done': agent.steps_done,
        'is_training': getattr(agent, 'is_training', False)
    })

@app.route('/reset_scene', methods=['POST'])
def reset_scene():
    """Reset the scene endpoint"""
    try:
        # Add any server-side reset logic here
        logger.info("🔄 Resetting scene from Flask endpoint")
        
        # Default state to return if no actual environment exists
        state = {
            'robot_position': [7, 0.1, 15], 
            'robot_rotation': [0, -math.pi / 2, 0, 1],
            'target_object': 'unknown', 
            'time_left': 500
        }
        
        # Return success with state data
        return jsonify({
            'status': 'success',
            'message': 'Scene reset successfully',
            'data': state
        })
    except Exception as e:
        logger.error(f"❌ Error in reset_scene: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error resetting scene: {str(e)}'
        }), 500
    
@app.route('/process_action', methods=['POST'])
def process_action():
    """Process action endpoint"""
    try:
        data = request.json
        action = data.get('action')
        state = data.get('state', {})
        
        logger.info(f"Processing action: {action}")
        
        # Simple mock reward calculation
        reward = 0
        if action == 'v':  # Take picture action
            # Extract data from state
            target_object = state.get('target_object')
            detections = state.get('detections', [])
            objects_in_view = state.get('objects_in_view', [])
            
            # Check if target object is in view
            target_in_view = any(obj.get('id') == target_object for obj in objects_in_view)
            
            # Check if target object is detected
            target_detected = any(det.get('class_id') == target_object for det in detections)
            
            if target_in_view:
                reward = 1000  # Maximum reward
                logger.info(f"Target object {target_object} is in view! Maximum reward.")
            elif target_detected:
                reward = 500   # Medium reward
                logger.info(f"Target object {target_object} is detected! Medium reward.")
            else:
                reward = 50    # Small reward for taking any picture
                logger.info("No target object detected or in view. Small reward.")
        
        return jsonify({
            'status': 'success',
            'action': action,
            'reward': reward,
            'done': action == 'v'  # Episode is done if we took a picture
        })
    except Exception as e:
        logger.error(f"❌ Error in process_action: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error processing action: {str(e)}'
        }), 500

@app.route('/initialize_agent', methods=['POST'])
def init_agent_endpoint():
    """Initialize the agent endpoint"""
    success = initialize_agent()
    if success:
        return jsonify({
            'status': 'success',
            'message': 'Agent initialized successfully'
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Failed to initialize agent'
        }), 500

@app.route('/train', methods=['POST'])
def train_agent():
    """Start or stop agent training"""
    if agent is None:
        return jsonify({
            'status': 'error',
            'message': 'Agent not initialized'
        }), 404
    
    data = request.json
    start = data.get('start', True)
    
    if start:
        agent.is_training = True
        logger.info("Agent training started")
        return jsonify({
            'status': 'success',
            'message': 'Agent training started',
            'is_training': True
        })
    else:
        agent.is_training = False
        logger.info("Agent training stopped")
        return jsonify({
            'status': 'success',
            'message': 'Agent training stopped',
            'is_training': False
        })

# Main entry point
if __name__ == '__main__':
    # Initialize the agent
    initialize_agent()
    
    # Start WebSocket server in a separate thread
    ws_thread = threading.Thread(target=run_websocket_server, daemon=True)
    ws_thread.start()
    logger.info("WebSocket server thread started")
    
    # Start Flask app
    app.run(debug=True, port=int(port), host='0.0.0.0', use_reloader=False)