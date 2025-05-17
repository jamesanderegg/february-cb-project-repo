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
  onSaveReplay = () => { },
  replayFilename = '',
  setReplayFilename = () => { },
  liveStateRef = { current: {} },
  timerRef = { current: 0 },
  selectedReplay = '',
  setSelectedReplay = () => { },
  isReplayPlaying = false,
  onStartReplay = () => { },
  onStopReplay = () => { },
  controlMode = 'manual',
  setControlMode = () => { },
  className = 'agent-dashboard',
  activeTab: forcedTab = null,
  onClose = () => { },
  targetObject
}) => {
  const [activeTab, setActiveTab] = useState(forcedTab || 'status');

  useEffect(() => {
    if (isConnected && (forcedTab === 'replay' || forcedTab === null)) {
      setActiveTab('replay');
      onFetchReplays();
    } else if (forcedTab) {
      setActiveTab(forcedTab);
    } 
    // else {
    //   setActiveTab('status');
    // }
  }, [isConnected, onFetchReplays]);

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(p => p + 1), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      {/* Status Indicator */}
      <div className="dashboard-section status-row">
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        {!forcedTab && (
          <>
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
          </>
        )}

      </div>

      {/* Control Mode Selector */}
      {isConnected && activeTab !== 'status' && (
        <div className="control-mode-selector">
          <label>Control Mode:</label>
          <select
            value={controlMode}
            onChange={(e) => setControlMode(e.target.value)}
            className="control-mode-dropdown"
          >
            <option value="manual">Manual</option>
            <option value="replay">Replay</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      )}

      {/* Tab Toggle */}
      {!forcedTab && (
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
          {/* <div
            className={`dashboard-tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status
          </div> */}
        </div>
      )}

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
            <select
              id="replaySelect"
              className="replay-dropdown"
              value={selectedReplay}
              onChange={(e) => setSelectedReplay(e.target.value)}
            >
              <option value="" disabled>Select a replay</option>
              {replays.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>

            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                className="record-button"
                onClick={onStartReplay}
                disabled={!selectedReplay || isReplayPlaying}
              >
                ▶️
              </button>
              <button
                className="record-button"
                onClick={onStopReplay}
                disabled={!selectedReplay || !isReplayPlaying}
              >
                ⏹
              </button>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button className="record-button" onClick={onStartRecording}>Start Recording</button>
              <button className="record-button" onClick={onStopRecording}>Stop Recording</button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Replay name"
                value={replayFilename}
                onChange={(e) => setReplayFilename(e.target.value)}
                style={{ width: '70%', marginRight: '5px' }}
              />
              <button className="record-button" onClick={onSaveReplay}>Save Replay</button>
            </div>
          </div>
        )}

        {activeTab === 'train' && (
          <div className="train-tab">
            <p>Training controls go here.</p>
          </div>
        )}

        {/* {activeTab === 'status' && (
          <div className="status-tab" style={{ fontSize: '11px', lineHeight: '1.3', fontFamily: 'monospace' }}>
            <h4 style={{ margin: '4px 0', fontSize: '12px' }}>🤖 Robot State</h4>
            <p><strong>Collision:</strong> {liveStateRef.current?.collision ? 'Yes' : 'No'}</p>
            <p><strong>Pos:</strong> {liveStateRef.current?.robot_pos?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
            <p><strong>Rot:</strong> {liveStateRef.current?.robot_rot?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
            <p><strong>Detected:</strong> {liveStateRef.current?.detectedObjects?.join(', ') || 'None'}</p>
            <p><strong>In View:</strong> {liveStateRef.current?.objectsInView?.join(', ') || 'None'}</p>
            <p><strong>Time Left:</strong> {liveStateRef.current?.time_left ?? '---'}s</p>
            <p><strong>Mode:</strong> {controlMode}</p>
            <p><strong>Target:</strong> {targetObject || '---'}</p>
            <p><strong>Actions:</strong> {liveStateRef.current?.currentActions?.join(', ') || 'None'}</p>
            <p><strong>Frame:</strong> #{liveStateRef.current?.frame_number ?? '---'}</p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default AgentDashboard;
