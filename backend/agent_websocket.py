# Import necessary libraries
import json
import asyncio
import websockets
from typing import Dict, Any, Optional

# This class will handle the websocket communication between the frontend and the DQNAgent
class AgentWebSocketHandler:
    def __init__(self, agent):
        """
        Initialize the WebSocket handler
        
        Args:
            agent: DQNAgent instance to use for processing
        """
        self.agent = agent
        self.clients = set()
    
    async def handler(self, websocket, path):
        """
        Handle incoming websocket connections and messages
        
        Args:
            websocket: WebSocket connection
            path: Connection path
        """
        # Register client
        self.clients.add(websocket)
        try:
            async for message in websocket:
                try:
                    # Parse the incoming JSON message
                    data = json.loads(message)
                    
                    # Process the message based on its type
                    response = await self.process_message(data)
                    
                    # Send response back to client
                    if response:
                        await websocket.send(json.dumps(response))
                        
                except json.JSONDecodeError:
                    print("Error: Received invalid JSON")
                    await websocket.send(json.dumps({"error": "Invalid JSON"}))
                except Exception as e:
                    print(f"Error processing message: {str(e)}")
                    await websocket.send(json.dumps({"error": str(e)}))
        finally:
            # Unregister client on disconnect
            self.clients.remove(websocket)
    
    async def process_message(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process incoming messages and route to appropriate handlers
        
        Args:
            data: The parsed JSON message
            
        Returns:
            Optional response to send back to the client
        """
        # Get message type
        msg_type = data.get('type')
        
        if msg_type == 'state':
            # Process state data and select an action
            return self.handle_state(data)
        elif msg_type == 'outcome':
            # Process action outcome
            return self.handle_outcome(data)
        elif msg_type == 'command':
            # Handle commands like start/stop training
            return self.handle_command(data)
        else:
            # Unknown message type
            return {"error": f"Unknown message type: {msg_type}"}
    
    def handle_state(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle state data from frontend and get action from agent
        
        Args:
            data: State data from frontend
            
        Returns:
            Selected action and metadata
        """
        # Extract the normalized data
        normalized_data = {
            'robot_position': data.get('robot_pos', [0, 0, 0]),
            'robot_rotation': data.get('robot_rot', [0, 0, 0, 1]),
            'collision_indicator': data.get('collision', False),
            'detections': data.get('detectedObjects', []),
            'time_left': data.get('time_left', 500),
            'target_object': data.get('target_object', None),
            'objects_in_view': data.get('objectsInViewRef', [])
        }
        
        # Pass to agent to get action
        action_info = self.agent.process_state_and_select_action(normalized_data)
        
        # Return the action to be sent back to frontend
        return {
            'type': 'action',
            'action': action_info['action'],
            'action_index': action_info['action_index'],
            'epsilon': action_info['epsilon'],
            'is_training': action_info['is_training']
        }
    
    def handle_outcome(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle action outcome from frontend
        
        Args:
            data: Action outcome data
            
        Returns:
            Processing result
        """
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
        
        result = self.agent.process_outcome(outcome_data)
        
        # Return processing result
        return {
            'type': 'outcome_processed',
            'success': result['success'],
            'steps_done': result['steps_done'],
            'memory_size': result['memory_size'],
            'epsilon': result['epsilon']
        }
    
    def handle_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle commands from frontend
        
        Args:
            data: Command data
            
        Returns:
            Command result
        """
        command = data.get('command')
        
        if command == 'start_training':
            # Set agent to training mode
            self.agent.is_training = True
            return {'type': 'command_result', 'command': command, 'success': True}
        
        elif command == 'stop_training':
            # Set agent to inference mode
            self.agent.is_training = False
            return {'type': 'command_result', 'command': command, 'success': True}
        
        elif command == 'save_model':
            # Save the model
            model_path = data.get('path', 'models/agent_model.pth')
            self.agent.save(model_path)
            return {'type': 'command_result', 'command': command, 'success': True, 'path': model_path}
        
        elif command == 'load_model':
            # Load the model
            model_path = data.get('path', 'models/agent_model.pth')
            try:
                self.agent.load(model_path)
                return {'type': 'command_result', 'command': command, 'success': True, 'path': model_path}
            except Exception as e:
                return {'type': 'command_result', 'command': command, 'success': False, 'error': str(e)}
        
        else:
            return {'type': 'command_result', 'command': command, 'success': False, 'error': 'Unknown command'}

# Function to start the WebSocket server
async def start_agent_websocket_server(agent, host='localhost', port=8765):
    """
    Start the WebSocket server for agent communication
    
    Args:
        agent: DQNAgent instance
        host: Server host
        port: Server port
    """
    handler = AgentWebSocketHandler(agent)
    server = await websockets.serve(handler.handler, host, port)
    print(f"Agent WebSocket server started at ws://{host}:{port}")
    return server