import React, { useState, useEffect } from 'react';
import ReplayPlayer from './ReplayPlayer';

/**
 * ReplayIntegration component - integrates replay player into the AgentDashboard
 * This component can be added to the Training tab in AgentDashboard.jsx
 */
const ReplayIntegration = ({
  COLAB_API_URL,
  replays = [],
  resetScene,
  setReplayPositions,
  isConnected,
  onFetchReplays
}) => {
  const [selectedReplay, setSelectedReplay] = useState(null);
  const [replayDropdownOpen, setReplayDropdownOpen] = useState(false);
  const [replayStatus, setReplayStatus] = useState({ message: 'Ready', type: 'ready' });
  
  // Fetch replays when component mounts or connectivity changes
  useEffect(() => {
    if (isConnected && onFetchReplays) {
      onFetchReplays();
    }
  }, [isConnected, onFetchReplays]);
  
  // Handle replay selection
  const handleSelectReplay = (replayName) => {
    console.log(`🎬 Selected replay: ${replayName}`);
    setSelectedReplay(replayName);
    setReplayDropdownOpen(false);
    setReplayStatus({ message: `Selected replay: ${replayName}`, type: 'info' });
  };
  
  // Handle replay completion
  const handlePlaybackComplete = () => {
    setReplayStatus({ message: 'Replay complete', type: 'complete' });
  };
  
  // Handle errors
  const handleError = (errorMessage) => {
    setReplayStatus({ message: `Error: ${errorMessage}`, type: 'error' });
  };
  
  return (
    <div className="replay-integration">
      <div className="replay-controls-section">
        <h3 className="section-title">Replay Controls</h3>
        
        {/* Status indicator */}
        <div className={`status status-${replayStatus.type}`}>
          {replayStatus.message}
        </div>
        
        {/* Replay selection dropdown */}
        <div className="replay-dropdown-container">
          <button 
            className="replay-dropdown-button"
            onClick={() => setReplayDropdownOpen(!replayDropdownOpen)}
            disabled={!isConnected || replays.length === 0}
          >
            {selectedReplay ? `Selected: ${selectedReplay}` : 'Select Replay'} {replayDropdownOpen ? '▲' : '▼'}
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
        
        {/* Replay player component */}
        {selectedReplay && (
          <ReplayPlayer
            COLAB_API_URL={COLAB_API_URL}
            replayName={selectedReplay}
            setReplayPositions={setReplayPositions}
            resetScene={resetScene}
            onPlaybackComplete={handlePlaybackComplete}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

export default ReplayIntegration;