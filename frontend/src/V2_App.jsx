import React, { useState, useEffect, useRef } from 'react';
import V2_MainCanvas from './number3/V2_MainCanvas';
import HUDView from "./number3/camera/V2_HUDView.jsx";
import MiniMapHUD from "./number3/camera/V2_MiniMapHUD.jsx";
import AgentDashboard from "./number3/controls/V2_AgentDashboard.jsx";
import { socket } from './number3/controls/socket.js';


function V2_App() {
  // Agent connection + control state
  const [isConnected, setIsConnected] = useState(false);
  const [replayFilename, setReplayFilename] = useState('');
  // Replay and training state
  const [replays, setReplays] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const robotPositionRef = useRef([0, 0, 0]);
  const robotRotationRef = useRef([0, 0, 0, 1]);
  const keysPressed = useRef({});
  const collisionIndicator = useRef(false);

  const [selectedReplay, setSelectedReplay] = useState('');
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);

  const recordingBufferRef = useRef([]);
  const isRecordingActiveRef = useRef(false);
  const frameResetRef = useRef(null);

  const timerRef = useRef(350);

  const [controlMode, setControlMode] = useState("manual"); // "manual" | "replay" | "agent"
  const currentActionRef = useRef([]);


  const liveStateRef = useRef({});

  // Endpoint (local for now, Colab later)
  const COLAB_API_URL = 'http://localhost:5001';



  // Connect WebSocket only on button press
  const handleConnect = () => {
    if (!socket.connected) {
      socket.connect();
    }
  };

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
  ;

  const handleStopRecording = () => {
    console.log("⏹ Stop Recording clicked");
    isRecordingActiveRef.current = false;
    const framesRecorded = recordingBufferRef.current.length;
    console.log(`🛑 Recording stopped. Frames recorded: ${framesRecorded}`);
    setSuccessMessage(`Recording stopped. ${framesRecorded} frames recorded.`);
  };

  const handleStartReplay = () => {
    if (selectedReplay) {
      console.log(`▶️ Starting replay: ${selectedReplay}`);
      setIsReplayPlaying(true);
      socket.emit("start_replay", { filename: selectedReplay });
    }
  };

  const handleStopReplay = () => {
    if (selectedReplay) {
      console.log(`⏹ Stopping replay: ${selectedReplay}`);
      setIsReplayPlaying(false);
      socket.emit("stop_replay");
    }
  };
  useEffect(() => {
    const onReplayFrame = (frame) => {
      if (frame?.currentActions) {
        currentActionRef.current = frame.currentActions;
      }
    };

    socket.on('replay_frame', onReplayFrame);
    return () => socket.off('replay_frame', onReplayFrame);
  }, []);



  // Fetch replay list from backend
  const handleFetchReplays = () => {
    fetch(`${COLAB_API_URL}/list_replays`)
      .then(res => res.json())
      .then(data => setReplays(data.replays || []))
      .catch(() => setErrorMessage('Failed to fetch replays'));
  };

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


  // Clear success/error messages
  const handleClearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Dispatch global scene reset
  const handleResetScene = () => {
    window.dispatchEvent(new CustomEvent('sceneReset'));
  };

  // Optional: Inject replay object positions
  const handleSetReplayPositions = (positions) => {
    window.dispatchEvent(new CustomEvent('injectObjectPositions', { detail: positions }));
  };
  // Monitor socket connection state
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (controlMode !== "manual") return;

    const interval = setInterval(() => {
      const manualKeys = Object.keys(keysPressed.current).filter(k => keysPressed.current[k]);
      currentActionRef.current = manualKeys;
    }, 50); // update every 50ms

    return () => clearInterval(interval);
  }, [controlMode]);

  return (
    <div className="app-container">
      <V2_MainCanvas
        robotPositionRef={robotPositionRef}
        robotRotationRef={robotRotationRef}
        keysPressed={keysPressed}
        collisionIndicator={collisionIndicator}
        liveStateRef={liveStateRef}
        recordingBufferRef={recordingBufferRef}
        isRecordingActiveRef={isRecordingActiveRef}
        frameResetRef={frameResetRef}
        timerRef={timerRef}
        currentActionRef={currentActionRef}
        controlMode={controlMode}
      />
      <HUDView />
      <MiniMapHUD />
      <AgentDashboard
        isConnected={isConnected}
        replays={replays}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onConnect={handleConnect}
        onFetchReplays={handleFetchReplays}
        resetScene={handleResetScene}
        COLAB_API_URL={COLAB_API_URL}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onSaveReplay={handleSaveReplay}
        replayFilename={replayFilename}
        setReplayFilename={setReplayFilename}
        liveStateRef={liveStateRef}
        timerRef={timerRef}
        selectedReplay={selectedReplay}
        setSelectedReplay={setSelectedReplay}
        isReplayPlaying={isReplayPlaying}
        onStartReplay={handleStartReplay}
        onStopReplay={handleStopReplay}
        controlMode={controlMode}
        setControlMode={setControlMode}

      />
    </div>
  );
}

export default V2_App;
