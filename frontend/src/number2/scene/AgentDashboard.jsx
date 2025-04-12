// AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
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
  const [serverUrl, setServerUrl] = useState(COLAB_API_URL || 'http://localhost:5001');
  const [trainingEpisodes, setTrainingEpisodes] = useState(10);
  
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
  
  return (
    <div className="agent-dashboard">
      <h2 className="dashboard-title">Robot Agent Dashboard</h2>
      
      {/* Connection Controls */}
      <div className="dashboard-section">
        <div className="url-input-container">
          <input 
            type="text" 
            value={serverUrl} 
            onChange={(e) => setServerUrl(e.target.value)} 
            className="url-input"
            placeholder="API URL"
          />
          <button 
            onClick={() => onConnect(serverUrl)} 
            className={`connect-button ${isConnected ? 'connected' : ''}`}
            disabled={isConnected || isLoading}
          >
            {isLoading ? '...' : isConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="dashboard-section" style={{ backgroundColor: '#f56565', padding: '8px', borderRadius: '4px' }}>
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="dashboard-section" style={{ backgroundColor: '#48bb78', padding: '8px', borderRadius: '4px' }}>
          {successMessage}
        </div>
      )}
      
      {/* Training Settings */}
      <div className="dashboard-section">
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
            style={{ 
              width: '60px', 
              padding: '4px', 
              backgroundColor: '#4a5568',
              color: 'white',
              border: '1px solid #718096',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
      
      {/* Agent Controls */}
      <div className="agent-controls dashboard-section">
        <div className="control-button training" 
             onClick={handleStartTraining}
             style={{ opacity: (!isConnected || agentStatus === 'training' || isLoading) ? 0.5 : 1 }}>
          {agentStatus === 'training' ? 'Training...' : 'Start Training'}
        </div>
        
        <div className="control-button stop" 
             onClick={onStopTraining}
             style={{ opacity: (!isConnected || agentStatus !== 'training') ? 0.5 : 1 }}>
          Stop Training
        </div>
        
        <div className="control-button inference" 
             onClick={onStartInference}
             style={{ opacity: (!isConnected || agentStatus === 'training') ? 0.5 : 1 }}>
          Start Inference  
        </div>
      </div>
      
      {/* Progress Bar (shown during training) */}
      {agentStatus === 'training' && (
        <div className="dashboard-section" style={{ padding: 0 }}>
          <div style={{ 
            height: '8px', 
            backgroundColor: '#4a5568', 
            borderRadius: '4px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${trainingProgress}%`, 
              backgroundColor: '#4299e1', 
              transition: 'width 0.3s ease' 
            }}></div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
            {trainingProgress.toFixed(1)}%
          </div>
        </div>
      )}
      
      {/* Replay Information */}
      {isConnected && (
        <div className="dashboard-section">
          <h3 className="section-title">Replay Data</h3>
          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            {replays.length} replay files available
          </div>
        </div>
      )}
      
      {/* Agent Status */}
      <div className="dashboard-section">
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