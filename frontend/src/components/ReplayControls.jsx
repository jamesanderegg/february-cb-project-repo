import React, { useState, useEffect } from 'react';
import '../styles/ReplayControls.css';

export const ReplayControls = ({ socket }) => {
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
    <div className={`replay-controls ${isMinimized ? 'minimized' : ''}`}>
      <div className="replay-header">
        <h3>Robot Replay & Training</h3>
        <button 
          className="minimize-button" 
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '+' : '−'}
        </button>
      </div>

      {!isMinimized && (
        <div className="replay-content">
          <div className="replay-tabs">
            <button 
              className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              Record
            </button>
            <button 
              className={`tab-button ${activeTab === 'playback' ? 'active' : ''}`}
              onClick={() => setActiveTab('playback')}
            >
              Play
            </button>
            <button 
              className={`tab-button ${activeTab === 'train' ? 'active' : ''}`}
              onClick={() => setActiveTab('train')}
            >
              Train
            </button>
            <button 
              className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage
            </button>
          </div>

          {activeTab === 'record' && (
            <div className="tab-content">
              <div className="control-row">
                <button 
                  className="btn btn-primary"
                  onClick={startRecording}
                  disabled={isRecording}
                >
                  Start Recording
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={stopRecording}
                  disabled={!isRecording}
                >
                  Stop
                </button>
              </div>
              <div className="control-row">
                <input
                  type="text"
                  className="form-control"
                  placeholder="replay_name.json"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
                <button 
                  className="btn btn-success"
                  onClick={saveReplay}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {activeTab === 'playback' && (
            <div className="tab-content">
              <div className="control-row">
                <select 
                  className="form-control"
                  onChange={(e) => loadReplay(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select a replay...</option>
                  {replays.map((replay) => (
                    <option key={replay.filename} value={replay.filename}>
                      {replay.filename} ({replay.episodes} eps)
                    </option>
                  ))}
                </select>
              </div>
              
              {isLoading && (
                <div className="loading-container">
                  <div className="loading-bar-container">
                    <div 
                      className="loading-bar" 
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <div className="loading-status">
                    Loading replay data...
                  </div>
                </div>
              )}

              {currentScreenData && (
                <div className="replay-info">
                  <div className="info-row">
                    <span>Episode:</span><span>{currentScreenData.episode + 1}</span>
                  </div>
                  <div className="info-row">
                    <span>Step:</span><span>{currentScreenData.step + 1}</span>
                  </div>
                  <div className="info-row">
                    <span>Action:</span><span>{currentScreenData.action}</span>
                  </div>
                  <div className="info-row">
                    <span>Reward:</span><span>{currentScreenData.reward?.toFixed(2) || '-'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'train' && (
            <div className="tab-content">
              <div className="control-row">
                <div className="input-group">
                  <label>Training Episodes:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={trainingEpisodes}
                    onChange={(e) => setTrainingEpisodes(parseInt(e.target.value) || 10)}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="input-group">
                  <label>Batch Size:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 32)}
                    min="8"
                    max="256"
                    step="8"
                  />
                </div>
              </div>

              <div className="control-row">
                <button 
                  className="btn btn-primary"
                  onClick={startTraining}
                  disabled={isTraining}
                >
                  Start Training
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={stopTraining}
                  disabled={!isTraining}
                >
                  Stop Training
                </button>
              </div>

              {isTraining && (
                <div className="loading-container">
                  <div className="loading-bar-container">
                    <div 
                      className="loading-bar" 
                      style={{ width: `${trainingProgress}%` }}
                    ></div>
                  </div>
                  <div className="loading-status">
                    Training in progress ({trainingProgress.toFixed(1)}%)...
                  </div>
                </div>
              )}

              {trainingStats && (
                <div className="replay-info">
                  <div className="info-row">
                    <span>Episodes:</span><span>{trainingStats.episodes}</span>
                  </div>
                  <div className="info-row">
                    <span>Loss:</span><span>{trainingStats.loss?.toFixed(4) || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span>Avg Reward:</span><span>{trainingStats.avg_reward?.toFixed(2) || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span>Epsilon:</span><span>{trainingStats.epsilon?.toFixed(3) || '-'}</span>
                  </div>
                </div>
              )}

              <div className="control-row">
                <input
                  type="text"
                  className="form-control"
                  placeholder="model_name.h5"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
                <div className="button-group">
                  <button 
                    className="btn btn-success"
                    onClick={saveModel}
                    disabled={isTraining}
                  >
                    Save Model
                  </button>
                  <button 
                    className="btn btn-warning"
                    onClick={loadModel}
                    disabled={isTraining}
                  >
                    Load Model
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="tab-content">
              <div className="control-row">
                <button 
                  className="btn btn-warning"
                  onClick={feedToAgent}
                >
                  Feed to Agent
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={refreshList}
                >
                  Refresh List
                </button>
              </div>
              <div className="replay-count">
                {replays.length} replays available
              </div>
            </div>
          )}

          <div className={`status status-${status.type}`}>
            {status.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplayControls;