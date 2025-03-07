import React, { useState, useEffect } from 'react';
import '../styles/ReplayControls.css';

const ReplayControlsModal = ({ socket }) => {
  const [activeTab, setActiveTab] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentScreenData, setCurrentScreenData] = useState(null);
  const [loadedScreens, setLoadedScreens] = useState({});
  const [status, setStatus] = useState({ message: 'Ready', type: 'ready' });
  const [replays, setReplays] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [filename, setFilename] = useState('');
  const [trainingEpisodes, setTrainingEpisodes] = useState(10);
  const [batchSize, setBatchSize] = useState(32);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStats, setTrainingStats] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Set up socket listeners
    socket.on('replay_status', handleReplayStatus);
    socket.on('replay_screen', handleReplayScreen);
    socket.on('training_status', handleTrainingStatus);
    socket.on('training_stats', handleTrainingStats);

    // Get initial list of replays
    socket.emit('replay_control', { command: 'list_replays' });

    // Clean up listeners
    return () => {
      socket.off('replay_status', handleReplayStatus);
      socket.off('replay_screen', handleReplayScreen);
      socket.off('training_status', handleTrainingStatus);
      socket.off('training_stats', handleTrainingStats);
    };
  }, [socket]);

  const handleReplayStatus = (data) => {
    console.log('Replay status update:', data);
    
    // Update status message
    setStatus({ 
      message: getStatusMessage(data), 
      type: data.status 
    });

    // Handle specific status updates
    switch (data.status) {
      case 'recording':
        setIsRecording(true);
        break;
      case 'stopped':
        setIsRecording(false);
        break;
      case 'available_replays':
        setReplays(data.replays || []);
        break;
      case 'loading':
        setIsLoading(true);
        setLoadingProgress(0);
        break;
      case 'loading_progress':
        setLoadingProgress((data.progress / data.total) * 100);
        break;
      case 'loaded':
        setIsLoading(false);
        break;
      default:
        break;
    }
  };

  const handleReplayScreen = (data) => {
    if (data && data.screen_id) {
      // Add screen to loaded screens
      setLoadedScreens(prev => ({
        ...prev,
        [data.screen_id]: data
      }));

      // If this is first screen, set it as current
      if (Object.keys(loadedScreens).length === 0) {
        setCurrentScreenData(data);
      }
    }
  };

  const handleTrainingStatus = (data) => {
    console.log('Training status update:', data);
    
    if (data.status === 'training') {
      setIsTraining(true);
      setTrainingProgress(data.progress || 0);
      
      // Update status message
      setStatus({
        message: `Training in progress: ${data.progress}%`,
        type: 'loading'
      });
    } else if (data.status === 'completed') {
      setIsTraining(false);
      setTrainingProgress(100);
      
      // Update status message
      setStatus({
        message: `Training completed (${data.episodes} episodes)`,
        type: 'saved'
      });
    } else if (data.status === 'error') {
      setIsTraining(false);
      
      // Update status message
      setStatus({
        message: `Training error: ${data.message}`,
        type: 'error'
      });
    }
  };

  const handleTrainingStats = (data) => {
    console.log('Training stats update:', data);
    setTrainingStats(data);
  };

  const startRecording = () => {
    socket.emit('replay_control', { command: 'start' });
  };

  const stopRecording = () => {
    socket.emit('replay_control', { command: 'stop' });
  };

  const saveReplay = () => {
    const replayName = filename || `replay_${Date.now()}.json`;
    socket.emit('replay_control', { 
      command: 'save',
      filename: replayName 
    });
  };

  const loadReplay = (replayName) => {
    if (!replayName) return;
    
    setIsLoading(true);
    setLoadedScreens({});
    
    socket.emit('replay_control', {
      command: 'load',
      filename: replayName,
      background: true
    });
  };

  const feedToAgent = () => {
    socket.emit('replay_control', { command: 'replay' });
  };

  const refreshList = () => {
    socket.emit('replay_control', { command: 'list_replays' });
  };

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStats(null);
    
    socket.emit('training_control', {
      command: 'start_training',
      episodes: trainingEpisodes,
      batch_size: batchSize
    });
    
    setStatus({
      message: 'Starting training...',
      type: 'loading'
    });
  };

  const stopTraining = () => {
    socket.emit('training_control', {
      command: 'stop_training'
    });
    
    setStatus({
      message: 'Stopping training...',
      type: 'warning'
    });
  };

  const saveModel = () => {
    socket.emit('training_control', {
      command: 'save_model',
      filename: filename || `model_${Date.now()}.h5`
    });
    
    setStatus({
      message: 'Saving model...',
      type: 'loading'
    });
  };

  const loadModel = () => {
    socket.emit('training_control', {
      command: 'load_model',
      filename: filename || 'model.h5'
    });
    
    setStatus({
      message: 'Loading model...',
      type: 'loading'
    });
  };

  const getStatusMessage = (data) => {
    switch(data.status) {
      case 'recording':
        return `Recording episode ${data.episode}...`;
      case 'stopped':
        return `Recording stopped. ${data.episode} episodes recorded.`;
      case 'saved':
        return `Saved ${data.episodes} episodes (${data.steps} steps).`;
      case 'loaded':
        return `Loaded ${data.episodes} episodes successfully.`;
      case 'replayed':
        return `Added ${data.experiences} experiences to agent memory.`;
      case 'error':
        return data.message || 'Error processing replay request.';
      default:
        return data.message || 'Ready';
    }
  };

  return (
    <div className="replay-controls-container">
      {/* Record Button Panel */}
      <div className="control-panel-item">
        <button 
          className={`action-button action-record ${isRecording ? 'disabled' : ''}`}
          onClick={startRecording}
          disabled={isRecording}
        >
          Start Recording
        </button>
      </div>

      {/* Stop Button Panel */}
      <div className="control-panel-item">
        <button 
          className={`action-button action-stop ${!isRecording ? 'disabled' : ''}`}
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop
        </button>
      </div>

      {/* Filename Input Panel */}
      <div className="control-panel-item">
        <div className="panel-content">
          <input
            type="text"
            className="form-control"
            placeholder="replay_name.json"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
      </div>

      {/* Save Button Panel */}
      <div className="control-panel-item">
        <button 
          className="action-button action-save"
          onClick={saveReplay}
        >
          Save
        </button>
      </div>

      {/* Play Button Panel */}
      <div className="control-panel-item">
        <button 
          className="action-button action-play"
          onClick={() => {
            if (replays.length > 0) {
              loadReplay(replays[0].filename);
            }
          }}
          disabled={isLoading || replays.length === 0}
        >
          Load Replay
        </button>
      </div>

      {/* Feed to Agent Button Panel */}
      <div className="control-panel-item">
        <button 
          className="action-button action-feed"
          onClick={feedToAgent}
        >
          Feed to Agent
        </button>
      </div>

      {/* Train Button Panel */}
      <div className="control-panel-item">
        <button 
          className="action-button action-train"
          onClick={startTraining}
          disabled={isTraining}
        >
          Train Agent
        </button>
      </div>

      {/* Status Panel */}
      <div className="control-panel-item">
        <div className={`status status-${status.type}`}>
          {status.message}
        </div>
      </div>
    </div>
  );
};

export default ReplayControlsModal;