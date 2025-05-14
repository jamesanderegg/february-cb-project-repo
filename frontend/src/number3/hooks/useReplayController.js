import { useState, useRef, useEffect } from 'react';
import { socket } from '../controls/socket.js';

const COLAB_API_URL = 'http://localhost:5001';

export function useReplayController() {
  // Replay state
  const [replays, setReplays] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState('');
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayFilename, setReplayFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Recording state
  const recordingBufferRef = useRef([]);
  const isRecordingActiveRef = useRef(false);
  const currentActionRef = useRef([]);
  
  // Handle starting recording
  const handleStartRecording = () => {
    console.log("🔁 Resetting scene before recording...");
    window.dispatchEvent(new CustomEvent('sceneReset'));

    // Delay actual recording start to let the reset finish (~200ms)
    setTimeout(() => {
      console.log("🔴 Start Recording clicked");
      isRecordingActiveRef.current = true;
      recordingBufferRef.current = [];
      setSuccessMessage("Recording started.");
    }, 250);
  };

  // Handle stopping recording
  const handleStopRecording = () => {
    console.log("⏹ Stop Recording clicked");
    isRecordingActiveRef.current = false;
    const framesRecorded = recordingBufferRef.current.length;
    console.log(`🛑 Recording stopped. Frames recorded: ${framesRecorded}`);
    setSuccessMessage(`Recording stopped. ${framesRecorded} frames recorded.`);
  };

  // Handle starting replay
  const handleStartReplay = () => {
    if (selectedReplay) {
      console.log(`▶️ Starting replay: ${selectedReplay}`);
      setIsReplayPlaying(true);
      socket.emit("start_replay", { filename: selectedReplay });
    }
  };

  // Handle stopping replay
  const handleStopReplay = () => {
    if (selectedReplay) {
      console.log(`⏹ Stopping replay: ${selectedReplay}`);
      setIsReplayPlaying(false);
      socket.emit("stop_replay");
    }
  };

  // Fetch replays from backend
  const handleFetchReplays = () => {
    fetch(`${COLAB_API_URL}/list_replays`)
      .then(res => res.json())
      .then(data => setReplays(data.replays || []))
      .catch(() => setErrorMessage('Failed to fetch replays'));
  };

  // Save replay to backend
  const handleSaveReplay = () => {
    if (!replayFilename) {
      setErrorMessage("Please enter a filename before saving.");
      return;
    }

    const filename = `${replayFilename}_${Date.now()}.json`;
    const replayData = recordingBufferRef.current;

    fetch(`${COLAB_API_URL}/save_replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data: replayData }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ Replay saved:", data);
        setSuccessMessage(`Replay saved: ${filename}`);
        setReplayFilename('');
        handleFetchReplays(); // refresh list
      })
      .catch(err => {
        console.error("❌ Failed to save replay", err);
        setErrorMessage("Failed to save replay");
      });
  };

  // Clear messages
  const handleClearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Listen for replay frames
  useEffect(() => {
    const onReplayFrame = (frame) => {
      if (frame?.currentActions) {
        currentActionRef.current = frame.currentActions;
      }
    };

    socket.on('replay_frame', onReplayFrame);
    return () => socket.off('replay_frame', onReplayFrame);
  }, []);

  return {
    // State
    replays,
    selectedReplay,
    setSelectedReplay,
    isReplayPlaying,
    replayFilename,
    setReplayFilename,
    errorMessage,
    successMessage,
    recordingBufferRef,
    isRecordingActiveRef,
    currentActionRef,
    
    // Actions
    handleStartRecording,
    handleStopRecording,
    handleStartReplay,
    handleStopReplay,
    handleFetchReplays,
    handleSaveReplay,
    handleClearMessages,
    
    // Constants
    COLAB_API_URL
  };
}

export default useReplayController;