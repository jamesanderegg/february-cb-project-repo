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
  isRecordingActiveRef = { current: false },
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
          <span
            className={`status-dot ${isConnected ? "connected" : "disconnected"
              }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>

        {!forcedTab && (
          <>
            <button
              className={`connect-button ${isConnected ? "connected" : ""}`}
              onClick={onConnect}
              disabled={isConnected}
            >
              {isConnected ? "Connected" : "Connect"}
            </button>
            <button className="reset-button" onClick={resetScene}>
              Reset Scene
            </button>
          </>
        )}
      </div>

      {/* Control Mode Selector */}
      {isConnected && activeTab !== "status" && (
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
            className={`dashboard-tab ${activeTab === "replay" ? "active" : ""
              } ${!isConnected ? "disabled" : ""}`}
            onClick={() => isConnected && setActiveTab("replay")}
            title={!isConnected ? "Connect to unlock" : ""}
          >
            Replay
          </div>
          <div
            className={`dashboard-tab ${activeTab === "train" ? "active" : ""
              } ${!isConnected ? "disabled" : ""}`}
            onClick={() => isConnected && setActiveTab("train")}
            title={!isConnected ? "Connect to unlock" : ""}
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
        {activeTab === "replay" && (
          <div className="replay-tab">
            {(errorMessage || successMessage) && (
              <div
                className={`dashboard-message ${errorMessage ? "error" : "success"
                  }`}
              >
                {errorMessage || successMessage}
              </div>
            )}

            <label htmlFor="replaySelect">Select Replay:</label>
            <select
              id="replaySelect"
              className="replay-dropdown"
              value={selectedReplay}
              onChange={(e) => {
                setControlMode('replay');
                setSelectedReplay(e.target.value);
              }}
            >
              <option value="" disabled>
                Select Replay
              </option>
              {replays.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <div
              style={{
                marginTop: "8px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
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

            <div style={{ marginTop: "8px" }}>
              {isRecordingActiveRef.current && (
  <div style={{ color: 'white', fontSize: 'small', marginBottom: '4px' }}>
    🔴 Recording
  </div>
)}

              <button
                className="record-button"
                onClick={onStartRecording}
                disabled={isRecordingActiveRef.current}
              >
                Start Recording
              </button>
              <button
                className="record-button"
                onClick={onStopRecording}
                disabled={!isRecordingActiveRef.current}
              >
                Stop Recording
              </button>
            </div>

            <div style={{ marginTop: "12px" }}>
              <input
                type="text"
                placeholder="Replay name"
                value={replayFilename}
                onChange={(e) => setReplayFilename(e.target.value)}
                style={{ width: "70%", marginRight: "5px" }}
              />
              <button className="record-button" onClick={onSaveReplay}>
                Save Replay
              </button>
            </div>
          </div>
        )}

        {activeTab === "train" && (
          <div className="train-tab">
            <p>Training controls go here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
