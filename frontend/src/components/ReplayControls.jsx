import React, { useState, useEffect } from 'react';
import '../styles/ReplayControls.css';

const ReplayControlsModal = ({ setObjectPositions, onReset }) => {
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

  const COLAB_API_URL = "https://1acd-104-199-170-14.ngrok-free.app";  

  useEffect(() => {
    // Fetch initial list of replays when the component mounts
    fetchReplays();
  }, []);

  const fetchReplays = async () => {
    try {
      const response = await fetch(`${COLAB_API_URL}/list_replays`);
  
      // Ensure response is JSON
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

  const startRecording = async () => {
    try {
      await fetch(`${COLAB_API_URL}/start_recording`, { method: 'POST' });
      setIsRecording(true);
    } catch (error) {
      console.error("❌ Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      await fetch(`${COLAB_API_URL}/stop_recording`, { method: 'POST' });
      setIsRecording(false);
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
    }
  };

  const saveReplay = async () => {
    const replayName = filename || `replay_${Date.now()}.json`;
    try {
      await fetch(`${COLAB_API_URL}/save_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
    } catch (error) {
      console.error("❌ Error saving replay:", error);
    }
  };

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

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStats(null);

    try {
      await fetch(`${COLAB_API_URL}/start_training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodes: trainingEpisodes,
          batch_size: batchSize
        })
      });
    } catch (error) {
      console.error("❌ Error starting training:", error);
    }
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

    // Set status message
    setStatus({ message: "Scene reset!", type: "info" });
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
          disabled={isTraining}
        >
          Train Agent
        </button>
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