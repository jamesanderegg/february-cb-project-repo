// AgentDashboard.jsx
import React, { useState } from 'react';
import '../../styles/AgentDashboard.css'; 

const AgentDashboard = ({ 
  agentStatus, 
  isConnected, 
  lastAction, 
  metrics,
  onConnect,
  onStartTraining,
  onStopTraining,
  onStartInference,
  COLAB_API_URL
}) => {
  const [serverUrl, setServerUrl] = useState(COLAB_API_URL || 'http://localhost:5001/api');  
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
            disabled={isConnected}
          >
            {isConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      {/* Agent Controls */}
      <div className="agent-controls dashboard-section">
        <button 
          onClick={onStartTraining} 
          className={`control-button training ${agentStatus === 'training' ? 'active' : ''}`}
          disabled={!isConnected || agentStatus === 'training'}
        >
          Start Training
        </button>
        
        <button 
          onClick={onStopTraining} 
          className="control-button stop"
          disabled={!isConnected || agentStatus !== 'training'}
        >
          Stop Training
        </button>
        
        <button 
          onClick={onStartInference} 
          className={`control-button inference ${agentStatus === 'inference' ? 'active' : ''}`}
          disabled={!isConnected || agentStatus === 'inference'}
        >
          Start Inference
        </button>
      </div>
      
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
      
      {/* Rewards Info */}
      {metrics.rewards && metrics.rewards.length > 0 && (
        <div className="dashboard-section">
          <h3 className="section-title">Recent Rewards</h3>
          <div className="rewards-info">
            <div>Latest: {metrics.rewards[metrics.rewards.length - 1]?.toFixed(2) || 0}</div>
            <div>Average: {(metrics.rewards.reduce((a, b) => a + b, 0) / metrics.rewards.length).toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;