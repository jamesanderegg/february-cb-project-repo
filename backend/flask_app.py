# Add this to your Colab notebook to handle WebSocket communication

import asyncio
import websockets
import json
import nest_asyncio

# Apply nest_asyncio to allow asyncio in Jupyter/Colab
nest_asyncio.apply()

# Function to handle WebSocket messages
async def handle_websocket(websocket, agent):
    """Handle WebSocket messages from frontend"""
    try:
        async for message in websocket:
            data = json.loads(message)
            
            # Process state data from frontend
            if 'robot_pos' in data:
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
                
                # Get action from agent
                action_idx = agent.select_action(agent.get_state_representation(normalized_data))
                action = agent.ACTIONS[action_idx]
                
                # Send action back to frontend
                await websocket.send(json.dumps({
                    'action': action,
                    'epsilon': agent.epsilon
                }))
    except Exception as e:
        print(f"WebSocket error: {str(e)}")

# Start WebSocket server
async def start_websocket_server(agent, host='0.0.0.0', port=8765):
    """Start WebSocket server for agent communication"""
    server = await websockets.serve(
        lambda ws, path: handle_websocket(ws, agent),
        host, 
        port
    )
    print(f"WebSocket server started at ws://{host}:{port}")
    return server

# Run this in your Colab notebook to start the server
def run_websocket_server(agent):
    """Start WebSocket server in Colab"""
    loop = asyncio.get_event_loop()
    server = loop.run_until_complete(start_websocket_server(agent))
    
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        print("Server stopped")
    finally:
        server.close()