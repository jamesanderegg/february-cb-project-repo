// AgentDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/AgentDashboard.css'; 

const AgentDashboard = ({ 
  agentStatus, 
  isConnected, 
  lastAction, 
  metrics,
  replays = [],
  isLoading = false,
  trainingProgress = 0,
  errorMessage = "",
  successMessage = "",
  onConnect,
  onStartTraining,
  onStopTraining,
  onStartInference,
  onFetchReplays,
  onClearMessages,
  COLAB_API_URL
}) => {
  const [activeTab, setActiveTab] = useState('replay');
  const [trainingEpisodes, setTrainingEpisodes] = useState(10);
  const [filename, setFilename] = useState('');
  const [replayDropdownOpen, setReplayDropdownOpen] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState({ message: 'Ready', type: 'ready' });
  const recordingControlsRef = useRef(null);
  
  // Get recording controls reference from window if available
  useEffect(() => {
    if (window.recordingControlsRef) {
      recordingControlsRef.current = window.recordingControlsRef.current;
    }
    
    // Listen for recording status updates
    const handleRecordingStatusChange = (event) => {
      if (event && event.detail) {
        // Handle replay status
        if (event.detail.isReplaying !== undefined) {
          // Update UI for replay status
          setStatus({
            message: event.detail.message || 'Replaying...',
            type: 'replaying'
          });
        } 
        else if (event.detail.type === 'complete') {
          // Update UI for completed replay
          setStatus({
            message: event.detail.message || 'Replay complete',
            type: 'complete'
          });
        }
        // Existing recording status handling...
        else if (event.detail.isRecording) {
          setStatus({
            message: 'Recording in progress...',
            type: 'recording'
          });
        } 
        else if (event.detail.autoStopped) {
          setStatus({
            message: `Recording auto-stopped: ${event.detail.reason || 'unknown reason'}`,
            type: 'warning'
          });
        } 
        else {
          setStatus({
            message: 'Recording stopped',
            type: 'warning'
          });
        }
      }
    };
    
    window.addEventListener('recordingStatusChanged', handleRecordingStatusChange);
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleRecordingStatusChange);
    };
  }, []);
  
  // Update replay selection when list changes
  useEffect(() => {
    if (isConnected && onFetchReplays) {
      onFetchReplays();
    }
  }, [isConnected, onFetchReplays]);
  
  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage && onClearMessages) {
      const timer = setTimeout(() => {
        onClearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onClearMessages]);
  
  // Handle starting training with current parameters
  const handleStartTraining = () => {
    onStartTraining(trainingEpisodes);
  };
  
  // Modified handleSelectReplay function for AgentDashboard.jsx
  // const handleSelectReplay = (replayName) => {
  //   console.log(`Selected replay: ${replayName}`);
  //   // Close dropdown
  //   setReplayDropdownOpen(false);
    
  //   // First, reset the scene to ensure clean replay
  //   if (window.resetEnvironment) {
  //     window.resetEnvironment();
  //     setRecordingStatus({ message: 'Scene reset for replay...', type: 'info' });
  //   }
    
  //   // Load the selected replay using the API
  //   fetch(`${COLAB_API_URL}/load_replay`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ filename: replayName })
  //   })
  //   .then(response => response.json())
  //   .then(data => {
  //     console.log(`✅ Loaded replay: ${replayName}`);
  //     setRecordingStatus({ message: `Loaded replay: ${replayName}`, type: 'info' });
      
  //     // Now that the replay is loaded, start the replay
  //     return fetch(`${COLAB_API_URL}/start_replay`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ filename: replayName })
  //     });
  //   })
  //   .then(response => response.json())
  //   .then(data => {
  //     console.log(`▶️ Started replay playback`);
  //     setRecordingStatus({ message: 'Replay in progress...', type: 'recording' });
  //   })
  //   .catch(error => {
  //     console.error(`❌ Error with replay: ${error}`);
  //     setRecordingStatus({ message: `Error with replay: ${error}`, type: 'error' });
  //   });
  // };

  // Handle replay selection
  const handleSelectReplay = (replayName) => {
    console.log(`Selected replay: ${replayName}`);
    // Close dropdown
    setReplayDropdownOpen(false);
    
    // First, reset the scene to ensure clean replay
    if (window.resetEnvironment) {
      window.resetEnvironment();
      setRecordingStatus({ message: 'Scene reset for replay...', type: 'info' });
      
      // Wait a short time for reset to complete
      setTimeout(() => {
        executeReplayLoading(replayName);
      }, 500);
    } else {
      executeReplayLoading(replayName);
    }
  };

  const executeReplayLoading = (replayName) => {
    // Load the selected replay using the API
    fetch(`${COLAB_API_URL}/load_replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: replayName })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`✅ Loaded replay: ${replayName}`);
      setRecordingStatus({ message: `Loaded replay: ${replayName}`, type: 'info' });
      
      // Now that the replay is loaded, start the replay
      return fetch(`${COLAB_API_URL}/start_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
    })
    .then(response => response.json())
    .then(data => {
      console.log(`▶️ Started replay playback: ${data.message}`);
      setRecordingStatus({ message: 'Replay in progress...', type: 'replaying' });
    })
    .catch(error => {
      console.error(`❌ Error with replay: ${error}`);
      setRecordingStatus({ message: `Error with replay: ${error}`, type: 'error' });
    });
  };
  
  // Handle recording functions
  const startRecording = () => {
    // First, reset scene if needed
    if (window.resetEnvironment) {
      window.resetEnvironment();
      
      // Wait a short time for reset to complete
      setTimeout(() => {
        executeStartRecording();
      }, 500);
    } else {
      executeStartRecording();
    }
  };
  
  const executeStartRecording = () => {
    fetch(`${COLAB_API_URL}/start_recording`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        console.log("🎥 Recording started");
        // Update global recording state
        window.isRecordingActive = true;
        window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
          detail: { isRecording: true }
        }));
        setRecordingStatus({ message: 'Recording in progress...', type: 'recording' });
      })
      .catch(error => {
        console.error("❌ Error starting recording:", error);
        setRecordingStatus({ message: 'Failed to start recording', type: 'error' });
      });
  };
  
  const stopRecording = () => {
    fetch(`${COLAB_API_URL}/stop_recording`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        console.log("⏹️ Recording stopped");
        // Update global recording state
        window.isRecordingActive = false;
        window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
          detail: { isRecording: false }
        }));
        setRecordingStatus({ message: 'Recording stopped. Ready to save.', type: 'warning' });
      })
      .catch(error => {
        console.error("❌ Error stopping recording:", error);
        setRecordingStatus({ message: 'Failed to stop recording', type: 'error' });
      });
  };
  
  const saveReplay = () => {
    const replayName = filename || `replay_${Date.now()}.json`;
    setRecordingStatus({ message: 'Saving replay...', type: 'info' });
    
    fetch(`${COLAB_API_URL}/save_replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: replayName })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`💾 Saved replay as ${replayName}`);
      setRecordingStatus({ message: `Saved replay as ${replayName}`, type: 'saved' });
      // Refresh replay list
      if (onFetchReplays) {
        onFetchReplays();
      }
      // Clear the filename input
      setFilename('');
    })
    .catch(error => {
      console.error("❌ Error saving replay:", error);
      setRecordingStatus({ message: 'Failed to save replay', type: 'error' });
    });
  };
  
  // Reset the scene
  const resetScene = () => {
    if (window.resetEnvironment) {
      window.resetEnvironment();
      setRecordingStatus({ message: 'Scene reset', type: 'info' });
    }
  };
  
  // Feed to agent
  const feedToAgent = () => {
    fetch(`${COLAB_API_URL}/feed_to_agent`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        console.log("✅ Fed to agent:", data);
        setRecordingStatus({ message: 'Replay fed to agent memory', type: 'saved' });
      })
      .catch(error => {
        console.error("❌ Error feeding to agent:", error);
        setRecordingStatus({ message: 'Failed to feed to agent', type: 'error' });
      });
  };
  
  return (
    <div className="agent-dashboard">
      <h2 className="dashboard-title">Robot Agent Dashboard</h2>
      
      {/* Connection Controls */}
      <div className="dashboard-section">
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <button 
          onClick={() => onConnect(COLAB_API_URL)} 
          className={`connect-button ${isConnected ? 'connected' : ''}`}
          disabled={isConnected || isLoading}
        >
          {isLoading ? '...' : isConnected ? 'Connected' : 'Connect'}
        </button>
      </div>
      
      {/* Status Indicator from ReplayControls */}
      <div className="dashboard-section status-indicator-section">
        <div className={`status status-${recordingStatus.type}`}>
          {recordingStatus.message}
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="dashboard-section error-message">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="dashboard-section success-message">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab ${activeTab === 'replay' ? 'active' : ''}`}
          onClick={() => setActiveTab('replay')}
        >
          Replay
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          Training
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Replay Tab */}
        {activeTab === 'replay' && (
          <div className="replay-tab">
            <div className="replay-controls-grid">
              <button 
                className="action-button record-button"  // ← matches .record-button
                onClick={startRecording}
                disabled={window.isRecordingActive || !isConnected}
              >
                Start Recording
              </button>

              <button 
                className="action-button stop-button"  // ← matches .stop-button
                onClick={stopRecording}
                disabled={!window.isRecordingActive || !isConnected}
              >
                Stop Recording
              </button>

              <div className="filename-input">
                <input 
                  type="text"
                  placeholder="replay_name.json"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  disabled={!isConnected}
                />
              </div>

              <button 
                className="action-button save-button"  // ← matches .save-button
                onClick={saveReplay}
                disabled={!isConnected}
              >
                Save Replay
              </button>

              <button 
                className="action-button reset-button"  // ← matches .reset-button
                onClick={resetScene}
              >
                Reset Scene
              </button>
            </div>
          </div>
        )}
        
        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="training-tab">
            {/* Replay Selection */}
            <div className="dashboard-section replay-selection-section">
              <h3 className="section-title-2"> </h3>
              
              {/* Replay Dropdown */}
              <div className="replay-dropdown-container">
                <button 
                  className="replay-dropdown-button"
                  onClick={() => setReplayDropdownOpen(!replayDropdownOpen)}
                  disabled={!isConnected || replays.length === 0}
                >
                  Load Replay {replayDropdownOpen ? '▲' : '▼'}
                </button>
                
                {replayDropdownOpen && replays.length > 0 && (
                  <div className="replay-dropdown-menu">
                    {replays.map((replay, index) => (
                      <div 
                        key={index} 
                        className="replay-dropdown-item"
                        onClick={() => handleSelectReplay(replay)}
                      >
                        {replay}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* <button 
                className="action-button feed-button"
                onClick={feedToAgent}
                disabled={!isConnected}
              >
                Feed to Agent
              </button> */}
            </div>
            
            {/* Training Settings */}
            <div className="dashboard-section training-settings-section">
              <h3 className="section-title">Training Settings</h3>
              <div className="settings-row">
                <label htmlFor="episodes">Episodes:</label>
                <input 
                  id="episodes"
                  type="number" 
                  min="1" 
                  max="100"
                  value={trainingEpisodes} 
                  onChange={(e) => setTrainingEpisodes(parseInt(e.target.value) || 10)} 
                  disabled={agentStatus === 'training' || !isConnected}
                />
              </div>
            </div>
            
            {/* Training Controls */}
            <div className="dashboard-section">
              <h3 className="section-title">Training Controls</h3>
              <div className="agent-controls">
                <div 
                  className="control-button training" 
                  onClick={handleStartTraining}
                  style={{ opacity: (!isConnected || agentStatus === 'training' || isLoading) ? 0.5 : 1 }}
                >
                  {agentStatus === 'training' ? 'Training...' : 'Start Training'}
                </div>
                
                <div 
                  className="control-button stop" 
                  onClick={onStopTraining}
                  style={{ opacity: (!isConnected || agentStatus !== 'training') ? 0.5 : 1 }}
                >
                  Stop Training
                </div>
                
                <div 
                  className="control-button inference" 
                  onClick={onStartInference}
                  style={{ opacity: (!isConnected || agentStatus === 'training') ? 0.5 : 1 }}
                >
                  Start Inference
                </div>
              </div>
            </div>
            
            {/* Progress Bar (shown during training) */}
            {agentStatus === 'training' && (
              <div className="dashboard-section training-progress-section">
                <h3 className="section-title">Training Progress</h3>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${trainingProgress}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {trainingProgress.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Agent Status */}
      <div className="dashboard-section">
        <h3 className="section-title">Agent Status</h3>
        <div className="status-grid">
          <div className="status-label">Status:</div>
          <div className="status-value">{agentStatus}</div>
          
          <div className="status-label">Last Action:</div>
          <div className="status-value">{lastAction || 'None'}</div>
          
          <div className="status-label">Epsilon:</div>
          <div className="status-value">{metrics.epsilon?.toFixed(3) || '1.000'}</div>
          
          <div className="status-label">Loss:</div>
          <div className="status-value">{metrics.loss?.toFixed(4) || '0.0000'}</div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;