import React, { useState, useEffect } from 'react';
import '../../styles/AgentDashboard.css';

const AgentDashboard = ({
  isConnected = false,
  onConnect = () => { },
  resetScene = () => { },
  onFetchReplays = () => { },
  replays = [],
  errorMessage = '',
  successMessage = '',
  onStartRecording = () => { },
  onStopRecording = () => { },
  onSaveReplay = () => {},
  replayFilename = '',
  setReplayFilename = () => {},
  liveStateRef = { current: {} },
}) => {
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    if (isConnected) {
      setActiveTab('replay');
      onFetchReplays();
    } else {
      setActiveTab('status');
    }
  }, [isConnected]);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="agent-dashboard">
      <div className="dashboard-title">Agent Dashboard</div>

      {/* Status & Actions */}
      <div className="dashboard-section status-row">
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <button
          className={`connect-button ${isConnected ? 'connected' : ''}`}
          onClick={onConnect}
          disabled={isConnected}
        >
          {isConnected ? 'Connected' : 'Connect'}
        </button>
        <button className="reset-button" onClick={resetScene}>
          Reset Scene
        </button>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <div
          className={`dashboard-tab ${activeTab === 'replay' ? 'active' : ''} ${!isConnected ? 'disabled' : ''}`}
          onClick={() => isConnected && setActiveTab('replay')}
          title={!isConnected ? 'Connect to unlock' : ''}
        >
          Replay
        </div>
        <div
          className={`dashboard-tab ${activeTab === 'train' ? 'active' : ''} ${!isConnected ? 'disabled' : ''}`}
          onClick={() => isConnected && setActiveTab('train')}
          title={!isConnected ? 'Connect to unlock' : ''}
        >
          Train
        </div>
        <div
          className={`dashboard-tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'replay' && (
          <div className="replay-tab">
            {(errorMessage || successMessage) && (
              <div className={`dashboard-message ${errorMessage ? 'error' : 'success'}`}>
                {errorMessage || successMessage}
              </div>
            )}

            <label htmlFor="replaySelect">Select Replay:</label>
            <select id="replaySelect" className="replay-dropdown">
              {replays.length === 0 && <option disabled>No replays found</option>}
              {replays.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>

            <div style={{ marginTop: '8px' }}>
              <button className="record-button" onClick={() => onStartRecording()}>
                Start Recording
              </button>
              <button className="record-button" onClick={() => onStopRecording()}>
                Stop Recording
              </button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Replay name"
                value={replayFilename}
                onChange={(e) => setReplayFilename(e.target.value)}
                style={{ width: '70%', marginRight: '5px' }}
              />
              <button className="record-button" onClick={onSaveReplay}>
                Save Replay
              </button>
            </div>
          </div>
        )}

        {activeTab === 'train' && (
          <div>Training controls go here.</div>
        )}

        {activeTab === 'status' && (
          <div className="status-tab" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'monospace' }}>
            <h4 style={{ margin: '4px 0', fontSize: '12px' }}>🤖 Robot State</h4>
            <p><strong>Collision:</strong> {liveStateRef.current?.collision ? 'Yes' : 'No'}</p>
            <p><strong>Pos:</strong> {liveStateRef.current?.robot_pos?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
            <p><strong>Rot:</strong> {liveStateRef.current?.robot_rot?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
            <p><strong>Detected:</strong> {liveStateRef.current?.detectedObjects?.join(', ') || 'None'}</p>
            <p><strong>In View:</strong> {liveStateRef.current?.objectsInView?.join(', ') || 'None'}</p>
            <p><strong>Time Left:</strong> {liveStateRef.current?.time_left ?? '---'}s</p>
            <p><strong>Target:</strong> {liveStateRef.current?.target_object || '---'}</p>
            <p><strong>Actions:</strong> {liveStateRef.current?.currentActions?.join(', ') || 'None'}</p>
            <p><strong>Frame:</strong> #{liveStateRef.current?.frame_number ?? '---'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
