import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ReplayPlayer component handling loading and playback of recorded replays
 */
const ReplayPlayer = ({ 
  COLAB_API_URL,
  replayName,
  setReplayPositions,
  resetScene,
  onPlaybackComplete,
  onError
}) => {
  const [status, setStatus] = useState('idle'); // idle, loading, playing, complete, error
  const [progress, setProgress] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Function to load replay data and object positions
  const loadReplay = useCallback(async () => {
    if (!replayName) return;
    
    try {
      setStatus('loading');
      setError(null);
      
      console.log(`🎬 Loading replay: ${replayName}`);
      
      // First load the object positions
      const objectResponse = await fetch(`${COLAB_API_URL}/get_replay_objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
      if (!objectResponse.ok) {
        throw new Error(`Failed to load object positions: ${objectResponse.statusText}`);
      }
      
      const objectData = await objectResponse.json();
      console.log('🌐 Loaded object positions:', objectData);
      
      if (objectData.objectPositions && objectData.objectPositions.length > 0) {
        // Inject object positions into the environment
        console.log(`🎮 Injecting ${objectData.objectPositions.length} object positions`);
        setReplayPositions(objectData.objectPositions);
        
        // Allow time for objects to be positioned
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Reset the scene to apply object positions
        console.log('🔄 Calling resetScene() after injecting object positions');
        resetScene();
        
        // Allow time for reset to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.warn('⚠️ No object positions found in replay data');
      }
      
      // Now load the replay itself
      const replayResponse = await fetch(`${COLAB_API_URL}/load_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
      if (!replayResponse.ok) {
        throw new Error(`Failed to load replay: ${replayResponse.statusText}`);
      }
      
      const replayData = await replayResponse.json();
      console.log('✅ Loaded replay data:', replayData);
      
      // Update UI with loaded state
      setStatus('loaded');
    } catch (err) {
      console.error('❌ Error loading replay:', err);
      setStatus('error');
      setError(err.message);
      if (onError) onError(err.message);
    }
  }, [COLAB_API_URL, replayName, setReplayPositions, resetScene, onError]);

  // Function to start playback
  const startPlayback = useCallback(async () => {
    if (status !== 'loaded') {
      console.warn(`⚠️ Cannot start playback in '${status}' state`);
      return;
    }
    
    try {
      setStatus('playing');
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`${COLAB_API_URL}/start_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start replay: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('▶️ Started replay playback:', data);
      
      // Playback is now controlled by websocket events from the backend
      // The UI will be updated via the recordingStatusChanged events
      
      // We don't immediately set to complete here as the websocket events will
      // handle updating the UI as playback progresses
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('🛑 Replay playback aborted');
        return;
      }
      
      console.error('❌ Error starting replay:', err);
      setStatus('error');
      setError(err.message);
      if (onError) onError(err.message);
    }
  }, [COLAB_API_URL, replayName, status, onError]);

  // Function to cancel playback
  const cancelPlayback = useCallback(() => {
    if (status !== 'playing') return;
    
    // Cancel the ongoing fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Also call the cancel endpoint
    fetch(`${COLAB_API_URL}/cancel_replay`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        console.log('🛑 Replay cancelled:', data);
        setStatus('cancelled');
      })
      .catch(err => {
        console.error('❌ Error cancelling replay:', err);
      });
  }, [COLAB_API_URL, status]);

  // Set up event listeners for replay progress updates
  useEffect(() => {
    const handleReplayStatus = (event) => {
      if (!event.detail) return;
      
      // Handle replay progress updates
      if (event.detail.isReplaying !== undefined) {
        setStatus('playing');
        
        // Update progress if we have step information
        if (event.detail.step !== undefined && event.detail.totalSteps !== undefined) {
          setCurrentStep(event.detail.step);
          setTotalSteps(event.detail.totalSteps);
          const progressPercent = Math.floor((event.detail.step / event.detail.totalSteps) * 100);
          setProgress(progressPercent);
        }
      }
      
      // Handle replay completion
      if (event.detail.type === 'complete') {
        setStatus('complete');
        setProgress(100);
        
        if (onPlaybackComplete) {
          onPlaybackComplete();
        }
      }
    };
    
    window.addEventListener('recordingStatusChanged', handleReplayStatus);
    
    // Automatically load the replay when the component mounts and replayName changes
    if (replayName) {
      loadReplay();
    }
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleReplayStatus);
      
      // Cancel any ongoing playback when unmounting
      if (status === 'playing') {
        cancelPlayback();
      }
    };
  }, [replayName, loadReplay, cancelPlayback, status, onPlaybackComplete]);

  return (
    <div className="replay-player">
      <div className="replay-status">
        Status: {status}
        {error && <div className="replay-error">Error: {error}</div>}
      </div>
      
      {(status === 'playing' || status === 'complete') && (
        <div className="replay-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Step {currentStep}/{totalSteps} ({progress}%)
          </div>
        </div>
      )}
      
      <div className="replay-controls">
        {status === 'idle' && (
          <button onClick={loadReplay}>Load Replay</button>
        )}
        
        {status === 'loaded' && (
          <button onClick={startPlayback}>Start Playback</button>
        )}
        
        {status === 'playing' && (
          <button onClick={cancelPlayback}>Cancel</button>
        )}
        
        {(status === 'complete' || status === 'cancelled' || status === 'error') && (
          <button onClick={loadReplay}>Reload</button>
        )}
      </div>
    </div>
  );
};

export default ReplayPlayer;