import os
import time
import json
import numpy as np
from collections import deque

class ReplayCollector:
    """
    Records and manages experience replays from real or simulated environments
    with enhanced visualization support
    """
    def __init__(self, save_dir='replays'):
        self.save_dir = save_dir
        self.current_episode = []
        self.episodes = []
        self.recording = False
        self.episode_count = 0
        self.loaded_screens = {}  # Cache for loaded screen data
        
        # Create directory if it doesn't exist
        os.makedirs(save_dir, exist_ok=True)
    
    def start_recording(self):
        """Start recording experiences"""
        self.recording = True
        self.current_episode = []
        print("📹 Started recording experiences")
    
    def stop_recording(self):
        """Stop recording and save the current episode"""
        if self.recording and self.current_episode:
            self.episodes.append(self.current_episode)
            self.episode_count += 1
            print(f"✅ Stopped recording. Episode {self.episode_count} saved with {len(self.current_episode)} steps")
        self.recording = False
        self.current_episode = []
    
    def record_step(self, state, action, reward, next_state, done, viz_data=None):
        """Record a single step of experience with optional visualization data"""
        if not self.recording:
            return
        
        # Create a serializable experience record
        experience = {
            'state': state if isinstance(state, list) else state.tolist() if hasattr(state, 'tolist') else state,
            'action': action if isinstance(action, int) else int(action),
            'reward': float(reward),
            'next_state': next_state if isinstance(next_state, list) else next_state.tolist() if hasattr(next_state, 'tolist') else next_state,
            'done': bool(done)
        }
        
        # Add visualization data if provided
        if viz_data:
            experience['viz_data'] = viz_data
        
        self.current_episode.append(experience)
        
        # If episode is done, close it
        if done:
            self.stop_recording()
    
    def save_episodes(self, filename=None):
        """Save all recorded episodes to file"""
        if not self.episodes:
            print("No episodes to save")
            return None
        
        if filename is None:
            filename = f"replay_{int(time.time())}.json"
        
        file_path = os.path.join(self.save_dir, filename)
        
        replay_data = {
            'episodes': self.episodes,
            'episode_count': self.episode_count,
            'timestamp': time.time(),
            'total_steps': sum(len(ep) for ep in self.episodes)
        }
        
        with open(file_path, 'w') as f:
            json.dump(replay_data, f)
        
        print(f"💾 Saved {self.episode_count} episodes ({sum(len(ep) for ep in self.episodes)} steps) to {file_path}")
        return file_path
    
    def load_episodes(self, filename, background=False, socketio=None):
        """
        Load episodes from a file
        
        Args:
            filename: Name of the replay file
            background: If True, don't send individual screens to the client
            socketio: SocketIO instance for emitting status updates
        """
        file_path = os.path.join(self.save_dir, filename)
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            if socketio:
                socketio.emit('replay_status', {
                    'status': 'error',
                    'message': f'File not found: {filename}'
                })
            return False
        
        try:
            # Emit loading status
            if socketio:
                socketio.emit('replay_status', {
                    'status': 'loading',
                    'filename': filename
                })
            
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            self.episodes = data['episodes']
            self.episode_count = data.get('episode_count', len(self.episodes))
            self.loaded_screens = {}  # Clear screen cache
            
            # Count total steps for progress reporting
            total_steps = sum(len(ep) for ep in self.episodes)
            step_counter = 0
            
            # If not in background mode, send screen data for each step
            if not background and socketio:
                for episode_idx, episode in enumerate(self.episodes):
                    for step_idx, step in enumerate(episode):
                        # Create screen data
                        screen_id = f'ep{episode_idx}_step{step_idx}'
                        screen_data = self._create_screen_data(screen_id, episode_idx, step_idx, step)
                        
                        # Cache the screen data
                        self.loaded_screens[screen_id] = screen_data
                        
                        # Emit screen data
                        socketio.emit('replay_screen', screen_data)
                        
                        # Update progress
                        step_counter += 1
                        if step_counter % 10 == 0:
                            socketio.emit('replay_status', {
                                'status': 'loading_progress',
                                'progress': step_counter,
                                'total': total_steps
                            })
                        
                        # Sleep briefly to avoid flooding
                        time.sleep(0.01)
            
            # Emit loaded status
            if socketio:
                socketio.emit('replay_status', {
                    'status': 'loaded',
                    'filename': filename,
                    'episodes': self.episode_count,
                    'steps': total_steps
                })
            
            print(f"📂 Loaded {self.episode_count} episodes ({total_steps} steps) from {file_path}")
            return True
        except Exception as e:
            print(f"Error loading episodes: {e}")
            if socketio:
                socketio.emit('replay_status', {
                    'status': 'error',
                    'message': f'Error loading replay: {str(e)}'
                })
            return False
    
    def replay_to_memory(self, agent):
        """Replay all episodes to the agent's memory"""
        if not hasattr(agent, 'memory') or not self.episodes:
            return 0
            
        count = 0
        for episode in self.episodes:
            for exp in episode:
                state = np.array(exp['state'], dtype=np.float32)
                action = exp['action']
                reward = exp['reward']
                next_state = np.array(exp['next_state'], dtype=np.float32)
                done = exp['done']
                
                agent.memory.add(state, action, reward, next_state, done)
                count += 1
        
        print(f"📥 Added {count} experiences to replay memory")
        return count
    
    def get_screen(self, screen_id):
        """Get data for a specific screen by ID"""
        # Check if screen is in cache
        if screen_id in self.loaded_screens:
            return self.loaded_screens[screen_id]
        
        # Parse episode and step from screen_id
        try:
            parts = screen_id.split('_')
            episode_idx = int(parts[0][2:])  # Remove 'ep' prefix
            step_idx = int(parts[1][4:])     # Remove 'step' prefix
            
            # Get step data
            if 0 <= episode_idx < len(self.episodes):
                episode = self.episodes[episode_idx]
                if 0 <= step_idx < len(episode):
                    step = episode[step_idx]
                    
                    # Create and cache screen data
                    screen_data = self._create_screen_data(screen_id, episode_idx, step_idx, step)
                    self.loaded_screens[screen_id] = screen_data
                    return screen_data
        except Exception as e:
            print(f"Error parsing screen ID '{screen_id}': {e}")
        
        return None
    
    def preload_screens(self, current_screen_id, count=5):
        """Preload nearby screens for smoother playback"""
        preloaded_ids = []
        
        try:
            # Parse current position
            parts = current_screen_id.split('_')
            episode_idx = int(parts[0][2:])  # Remove 'ep' prefix
            step_idx = int(parts[1][4:])     # Remove 'step' prefix
            
            # Calculate range to preload (forward and backward)
            start_step = max(0, step_idx - count // 2)
            end_step = min(len(self.episodes[episode_idx]) - 1, step_idx + count // 2)
            
            # Preload screens
            for i in range(start_step, end_step + 1):
                if i == step_idx:  # Skip current screen
                    continue
                    
                screen_id = f'ep{episode_idx}_step{i}'
                if screen_id not in self.loaded_screens:
                    screen_data = self.get_screen(screen_id)
                    if screen_data:
                        preloaded_ids.append(screen_id)
        except Exception as e:
            print(f"Error preloading screens: {e}")
        
        return preloaded_ids
    
    def _create_screen_data(self, screen_id, episode_idx, step_idx, step):
        """Create formatted screen data from a step"""
        # Extract visualization data if available, or use default values
        viz_data = step.get('viz_data', {})
        
        screen_data = {
            'screen_id': screen_id,
            'episode': episode_idx,
            'step': step_idx,
            'action': viz_data.get('action', step.get('action', 'unknown')),
            'reward': viz_data.get('reward', step.get('reward', 0)),
            'state': viz_data.get('state', step.get('state', [])),
            # Add visualization specific data if available
            'robotPosition': viz_data.get('robotPosition', [0, 0, 0]),
            'robotRotation': viz_data.get('robotRotation', [0, 0, 0]),
            'detections': viz_data.get('detections', []),
            'targetObject': viz_data.get('targetObject', 0),
            'timeLeft': viz_data.get('timeLeft', 0)
        }
        
        # Add camera view if available
        if 'cameraView' in viz_data and viz_data['cameraView']:
            screen_data['cameraView'] = viz_data['cameraView']
        
        return screen_data