import React, { useState, useEffect } from 'react';
import '../styles/ReplayControls.css';

const ReplayControlsModal = ({ setObjectPositions, onReset, COLAB_API_URL, onRecordingRef }) => {
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
    // Fetch initial list of replays when the component mounts
    fetchReplays();
    
    // Expose recording state and stopRecording function to parent component
    if (onRecordingRef && typeof onRecordingRef === 'function') {
      onRecordingRef({
        isRecording: () => isRecording,
        stopRecording: stopRecording
      });
    }
  }, []); // Only run once on mount
  
  // Update recording state in window and dispatch event when it changes
  useEffect(() => {
    // Set global recording status for other components
    window.isRecordingActive = isRecording;
    
    // Notify other components of recording status change
    window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
      detail: { isRecording }
    }));
    
    console.log(`🎬 ReplayControls: Recording state set to ${isRecording}`);
  }, [isRecording]);

  const fetchReplays = async () => {
    try {
      const response = await fetch(`${COLAB_API_URL}/list_replays`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
  
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
  
      const data = await response.json();
      setReplays(data.replays || []);
    } catch (error) {
      console.error("❌ Error fetching replays:", error);
      setStatus({ message: "Failed to fetch replays", type: "error" });
    }
  };
  
  // const startRecording = async () => {
  //   try {
  //     const response = await fetch(`${COLAB_API_URL}/start_recording`, { method: 'POST' });
  //     const data = await response.json();
      
  //     // Update local state FIRST (this will trigger the useEffect)
  //     setIsRecording(true);
      
  //     // Then update other UI components
  //     setStatus({ 
  //       message: data.message || 'Recording started', 
  //       type: 'recording' 
  //     });
      
  //     console.log("🎥 Recording started - scene reset detection enabled");
  //   } catch (error) {
  //     console.error("❌ Error starting recording:", error);
  //     setStatus({ message: "Failed to start recording", type: "error" });
  //   }
  // };

  const startRecording = async () => {
    try {
      // First, reset the scene
      console.log("🔄 Resetting scene before starting recording...");
      if (onReset && typeof onReset === 'function') {
        onReset();
      } else if (window.resetEnvironment) {
        window.resetEnvironment();
      }
      
      // Wait a short time for the scene to fully reset
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now start recording
      const response = await fetch(`${COLAB_API_URL}/start_recording`, { method: 'POST' });
      const data = await response.json();
      
      // Update local state FIRST (this will trigger the useEffect)
      setIsRecording(true);
      
      // Then update other UI components
      setStatus({ 
        message: data.message || 'Recording started after scene reset', 
        type: 'recording' 
      });
      
      console.log("🎥 Recording started - scene reset completed");
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      setStatus({ message: "Failed to start recording", type: "error" });
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch(`${COLAB_API_URL}/stop_recording`, { method: 'POST' });
      const data = await response.json();
      
      // Update local state FIRST (this will trigger the useEffect)
      setIsRecording(false);
      
      // Then update other UI components
      setStatus({ 
        message: data.message || 'Recording stopped', 
        type: 'warning' 
      });
      
      console.log("⏹️ Recording stopped - scene reset detection disabled");
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
      setStatus({ message: "Failed to stop recording", type: "error" });
      // Still update the recording state even on error
      setIsRecording(false);
    }
  };

  const saveReplay = async () => {
    const replayName = filename || `replay_${Date.now()}.json`;
    try {
      // Show saving status
      setStatus({ message: "Saving replay...", type: "info" });
      
      const response = await fetch(`${COLAB_API_URL}/save_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
      const data = await response.json();
      
      // Update status based on response
      setStatus({ 
        message: data.message || `Saved replay as ${replayName}`, 
        type: data.status === 'error' ? 'error' : 'saved' 
      });
      
      console.log(`💾 Replay saved as ${replayName}`);
      
      // Refresh replay list after saving
      fetchReplays();
    } catch (error) {
      console.error("❌ Error saving replay:", error);
      setStatus({ message: "Failed to save replay", type: "error" });
    }
  };




  const handleReplayStatus = (data) => {
    console.log('Replay status update:', data);
    setStatus({ message: getStatusMessage(data), type: data.status });
  };

  const handleReplayScreen = (data) => {
    if (data && data.screen_id) {
      setLoadedScreens(prev => ({ ...prev, [data.screen_id]: data }));
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
      setStatus({
        message: `Training in progress: ${data.progress}%`,
        type: 'loading'
      });
    } else if (data.status === 'completed') {
      setIsTraining(false);
      setTrainingProgress(100);
      setStatus({
        message: `Training completed (${data.episodes} episodes)`,
        type: 'saved'
      });
    } else if (data.status === 'error') {
      setIsTraining(false);
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




  // const startRecording = async () => {
  //   try {
  //     await fetch(`${COLAB_API_URL}/start_recording`, { method: 'POST' });
  //     setIsRecording(true);
  //     console.log("🎥 Recording started - scene reset detection enabled");
  //   } catch (error) {
  //     console.error("❌ Error starting recording:", error);
  //   }
  // };

  // const stopRecording = async () => {
  //   try {
  //     await fetch(`${COLAB_API_URL}/stop_recording`, { method: 'POST' });
  //     setIsRecording(false);
  //     console.log("⏹️ Recording stopped - scene reset detection disabled");
  //   } catch (error) {
  //     console.error("❌ Error stopping recording:", error);
  //   }
  // };

  // const saveReplay = async () => {
  //   const replayName = filename || `replay_${Date.now()}.json`;
  //   try {
  //     await fetch(`${COLAB_API_URL}/save_replay`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ filename: replayName })
  //     });
  //   } catch (error) {
  //     console.error("❌ Error saving replay:", error);
  //   }
  // };

  const loadReplay = async (replayName) => {
    if (!replayName) return;
    try {
      setIsLoading(true);
      await fetch(`${COLAB_API_URL}/load_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      fetchReplays(); // Refresh replay list
    } catch (error) {
      console.error("❌ Error loading replay:", error);
    }
  };

  const feedToAgent = async () => {
    try {
      await fetch(`${COLAB_API_URL}/feed_to_agent`, { method: 'POST' });


    } catch (error) {
      console.error("❌ Error feeding to agent:", error);
    }
  };

  const takePicture = () => {
    setStatus({ message: "Taking picture...", type: "info" });
    
    try {
      // Create a keyboard event for 'v' key
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        code: 'KeyV',
        which: 86,
        keyCode: 86,
        bubbles: true
      });
      
      // Dispatch the event
      window.dispatchEvent(event);
      
      setStatus({ message: "Picture taken! Processing...", type: "info" });
    } catch (error) {
      console.error("❌ Error taking picture:", error);
      setStatus({ message: "Error taking picture", type: "error" });
    }
  };

  const startTraining = async () => {
    if (replays.length === 0) {
      setStatus({ message: "No replay files available for training", type: "error" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the latest saved replay file
      const latestReplay = replays[0];
      
      // Load the latest replay
      const loadResult = await fetch(`${COLAB_API_URL}/load_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: latestReplay })
      });
      
      const loadData = await loadResult.json();
      
      // Start training
      const trainResult = await fetch(`${COLAB_API_URL}/start_training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes: trainingEpisodes })
      });
      
      const trainData = await trainResult.json();
      
      setIsTraining(true);
      setStatus({ message: `Training started with ${trainingEpisodes} episodes`, type: "info" });
      
      // Monitor training progress
      const progressInterval = setInterval(async () => {
        try {
          const response = await fetch(`${COLAB_API_URL}/agent_status`);
          const data = await response.json();
          
          if (data.training_progress !== undefined) {
            setTrainingProgress(data.training_progress);
          }
          
          if (data.status !== "training") {
            clearInterval(progressInterval);
            setIsTraining(false);
            setTrainingProgress(100);
            setStatus({ message: "Training completed!", type: "saved" });
          }
        } catch (error) {
          console.error("Failed to fetch training progress:", error);
        }
      }, 1000);
      
    } catch (error) {
      console.error("Training error:", error);
      setStatus({ message: error.message || "Failed to start training", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to show a more prominent notification for auto-stop
  // const showAutoStopNotification = (reason) => {
  //   // Create notification element
  //   const notification = document.createElement('div');
  //   notification.style.position = 'fixed';
  //   notification.style.top = '50%';
  //   notification.style.left = '50%';
  //   notification.style.transform = 'translate(-50%, -50%)';
  //   notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  //   notification.style.color = 'white';
  //   notification.style.padding = '20px';
  //   notification.style.borderRadius = '10px';
  //   notification.style.zIndex = '10000';
  //   notification.style.fontSize = '18px';
  //   notification.style.textAlign = 'center';
  //   notification.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    
  //   // Set notification content
  //   notification.innerHTML = `
  //     <div style="margin-bottom: 10px; font-weight: bold;">
  //       ⚠️ Recording Automatically Stopped
  //     </div>
  //     <div style="margin-bottom: 15px;">
  //       Episode ended due to ${reason}
  //     </div>
  //     <div style="font-size: 14px;">
  //       You can now save this replay
  //     </div>
  //   `;
    
  //   // Add to document
  //   document.body.appendChild(notification);
    
  //   // Remove after 3 seconds
  //   setTimeout(() => {
  //     document.body.removeChild(notification);
  //   }, 3000);
  // };

  // Set up socket connection to receive auto-stop notifications
  // useEffect(() => {
  //   // Create socket connection
  //   const socket = io(COLAB_API_URL.replace("http", "ws"), {
  //     transports: ["websocket"]
  //   });
    
  //   // Listen for replay status updates
  //   socket.on('replay_status', (statusUpdate) => {
  //     console.log('📊 Replay status update:', statusUpdate);
      
  //     // Handle auto-stop from backend
  //     if (statusUpdate.status === 'stopped' && statusUpdate.auto_stopped === true) {
  //       console.log(`🛑 Recording auto-stopped due to: ${statusUpdate.stop_reason}`);
        
  //       // Update local recording state
  //       setIsRecording(false);
        
  //       // Update status with special message
  //       const reason = statusUpdate.stop_reason === 'collision' ? 'collision detected' : 'picture taken';
  //       setStatus({
  //         message: `Recording automatically stopped (${reason}). Ready to save.`,
  //         type: 'warning'
  //       });
        
  //       // Show a more prominent notification
  //       showAutoStopNotification(reason);
  //     } else {
  //       // Handle other status updates
  //       updateStatusFromResponse(statusUpdate);
  //     }
  //   });
    
  //   // Clean up socket on unmount
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [COLAB_API_URL]);

  const startMonitoringProgress = () => {
    // Poll for training progress
    const progressInterval = setInterval(async () => {
      try {
        const response = await fetch(`${COLAB_API_URL}/agent_status`);
        const data = await response.json();
        
        // Update training progress
        if (data.training_progress !== undefined) {
          setTrainingProgress(data.training_progress);
        }
        
        // Check if training is still active
        if (data.status !== "training") {
          clearInterval(progressInterval);
          setIsTraining(false);
          setTrainingProgress(100); // Set to 100% when complete
          setSuccessMessage("Training completed!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } catch (error) {
        console.error("Failed to fetch training progress:", error);
      }
    }, 1000);
    
    // Store the interval ID for cleanup
    progressIntervalRef.current = progressInterval;
  };
  

  const stopTraining = async () => {
    try {
      await fetch(`${COLAB_API_URL}/stop_training`, { method: 'POST' });
    } catch (error) {
      console.error("❌ Error stopping training:", error);
    }
  };

  const resetScene = () => {
    console.log("🔄 Resetting scene from ReplayControls...");
    
    // Check if recording is in progress, and stop it before resetting
    if (isRecording) {
      console.log("Recording in progress - stopping recording automatically");
      stopRecording();
      setStatus({ message: "Recording stopped due to scene reset. Please save your experience.", type: "warning" });
    }
    
    // Use the reset function passed from parent
    if (onReset && typeof onReset === 'function') {
      onReset();
    } else {
      console.warn("Reset function not provided to ReplayControls!");
      
      // Call the global reset function if available as fallback
      if (window.resetEnvironment) {
        window.resetEnvironment();
      }
      
      // Force an update by clearing objectPositions (handled in MainScene)
      setObjectPositions([]);
    }

    // Also call reset_scene endpoint in the backend
    try {
      fetch(`${COLAB_API_URL}/reset_scene`, { method: 'POST' });
    } catch (error) {
      console.error("❌ Error calling reset_scene API:", error);
    }

    // Set status message if not already set by recording stop
    if (!isRecording) {
      setStatus({ message: "Scene reset!", type: "info" });
    }
  };

  const getStatusMessage = (data) => {
    switch (data.status) {
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

      {/* Load Replay Button Panel */}
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
          disabled={isTraining || replays.length === 0}
        >
          {isTraining ? 'Training...' : 'Train Agent'}
        </button>

        {isTraining && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">{trainingProgress.toFixed(1)}%</div>
          </div>
        )}
      </div>

      {/* Reset Button Panel */}
      <div className="control-panel-item">
        <button
          className="action-button action-stop"
          onClick={resetScene}
        >
          Reset Scene
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