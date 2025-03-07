import os
import threading
import time
import json
import glob

class ReplayCollector:
    def __init__(self, save_dir='experiences'):
        """Initialize the replay collector with a save directory"""
        self.save_dir = save_dir
        self.lock = threading.Lock()
        self.current_episode = []
        self.episodes = []
        self.is_recording = False
        self.episode_counter = 0
        
        # Create save directory if it doesn't exist
        os.makedirs(save_dir, exist_ok=True)
    
    def start_recording(self):
        """Start recording a new episode"""
        with self.lock:
            if self.is_recording:
                return {
                    'status': 'recording',
                    'episode': self.episode_counter,
                    'message': 'Already recording'
                }
            
            self.is_recording = True
            self.current_episode = []
            self.episode_counter += 1
            
            return {
                'status': 'recording',
                'episode': self.episode_counter,
                'message': f'Started recording episode {self.episode_counter}'
            }
    
    def stop_recording(self):
        """Stop recording the current episode"""
        with self.lock:
            if not self.is_recording:
                return {
                    'status': 'stopped',
                    'episode': self.episode_counter,
                    'message': 'Not recording'
                }
            
            self.is_recording = False
            if self.current_episode:
                self.episodes.append(self.current_episode.copy())
            
            step_count = len(self.current_episode)
            self.current_episode = []
            
            return {
                'status': 'stopped',
                'episode': self.episode_counter,
                'steps': step_count,
                'message': f'Stopped recording episode {self.episode_counter} with {step_count} steps'
            }
    
    def add_experience(self, state, action, reward, next_state, done, metadata=None):
        """
        Add a new experience to the current episode
        
        Returns bool: Whether the experience was added
        """
        if not self.is_recording:
            return False
        
        with self.lock:
            experience = {
                'state': state,
                'action': action,
                'reward': reward,
                'next_state': next_state,
                'done': done,
                'timestamp': time.time()
            }
            
            if metadata:
                experience['metadata'] = metadata
            
            self.current_episode.append(experience)
            return True
    
    def save_replay(self, filename=None):
        """
        Save recorded episodes to a file
        
        Args:
            filename: Optional filename to save to
            
        Returns:
            dict: Information about the saved replay
        """
        with self.lock:
            if not self.episodes:
                return {
                    'status': 'error',
                    'message': 'No episodes to save'
                }
            
            if not filename:
                filename = f"replay_{int(time.time())}.json"
                
            if not filename.endswith('.json'):
                filename += '.json'
            
            filepath = os.path.join(self.save_dir, filename)
            
            # Convert numpy arrays to lists for JSON serialization
            serializable_episodes = []
            total_steps = 0
            
            for episode in self.episodes:
                serializable_episode = []
                for exp in episode:
                    # Create a copy of the experience
                    serializable_exp = {}
                    for k, v in exp.items():
                        # Check if value is a numpy array
                        if hasattr(v, 'tolist'):
                            serializable_exp[k] = v.tolist()
                        else:
                            serializable_exp[k] = v
                    
                    serializable_episode.append(serializable_exp)
                    total_steps += 1
                
                serializable_episodes.append(serializable_episode)
            
            # Save to file
            try:
                with open(filepath, 'w') as f:
                    json.dump({
                        'episodes': serializable_episodes,
                        'metadata': {
                            'timestamp': time.time(),
                            'episode_count': len(serializable_episodes),
                            'total_steps': total_steps
                        }
                    }, f)
                
                return {
                    'status': 'saved',
                    'episodes': len(serializable_episodes),
                    'steps': total_steps,
                    'filename': filename
                }
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f"Error saving replay: {str(e)}"
                }
    
    def load_replay(self, filename, background=False):
        """
        Load episodes from a file
        
        Args:
            filename: Name of file to load episodes from
            background: Whether to load in background
            
        Returns:
            dict: Information about the loaded episodes
        """
        filepath = os.path.join(self.save_dir, filename)
        
        if not os.path.exists(filepath):
            return {
                'status': 'error',
                'message': f"File not found: {filepath}"
            }
        
        if background:
            thread = threading.Thread(target=self._load_replay_thread, args=(filepath,))
            thread.start()
            return {
                'status': 'loading',
                'message': f'Loading replay {filename} in background'
            }
        else:
            return self._load_replay(filepath)
    
    def _load_replay_thread(self, filepath):
        """Background thread to load replay file"""
        result = self._load_replay(filepath)
        # You can emit a WebSocket message here with the result
        return result
    
    def _load_replay(self, filepath):
        """Internal method to load replay file"""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            with self.lock:
                self.episodes = data.get('episodes', [])
                
                total_steps = 0
                for episode in self.episodes:
                    total_steps += len(episode)
                
                # Reset current episode and recording state
                self.current_episode = []
                self.is_recording = False
                
                return {
                    'status': 'loaded',
                    'episodes': len(self.episodes),
                    'steps': total_steps,
                    'filename': os.path.basename(filepath)
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f"Error loading replay: {str(e)}"
            }
    
    def list_replays(self):
        """
        List all available replay files
        
        Returns:
            list: List of available replay files with metadata
        """
        replay_files = glob.glob(os.path.join(self.save_dir, '*.json'))
        result = []
        
        for filepath in replay_files:
            filename = os.path.basename(filepath)
            file_stats = os.stat(filepath)
            
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                metadata = data.get('metadata', {})
                result.append({
                    'filename': filename,
                    'size': file_stats.st_size,
                    'created': file_stats.st_ctime,
                    'episodes': metadata.get('episode_count', 0),
                    'steps': metadata.get('total_steps', 0)
                })
            except:
                # If we can't read the file, just include basic info
                result.append({
                    'filename': filename,
                    'size': file_stats.st_size,
                    'created': file_stats.st_ctime
                })
        
        return sorted(result, key=lambda x: x['created'], reverse=True)