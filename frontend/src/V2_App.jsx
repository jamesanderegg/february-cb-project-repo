import React, { useState, useEffect, useRef } from 'react';
import V2_MainCanvas from './number3/V2_MainCanvas';
import HUDView from "./number3/camera/V2_HUDView.jsx";
import MiniMapHUD from "./number3/camera/V2_MiniMapHUD.jsx";
import AgentDashboard from "./number3/controls/V2_AgentDashboard.jsx";
import { socket } from './number3/controls/socket.js';
import useReplayController from './number3/hooks/useReplayController.js';

function V2_App() {
  // Agent connection state
  const [isConnected, setIsConnected] = useState(false);
  
  // Use our new replay controller hook
  const replayController = useReplayController();
  
  // Robot state refs
  const robotPositionRef = useRef([0, 0, 0]);
  const robotRotationRef = useRef([0, 0, 0, 1]);
  const keysPressed = useRef({});
  const collisionIndicator = useRef(false);
  const frameResetRef = useRef(null);
  const timerRef = useRef(350);
  const liveStateRef = useRef({});

  // Control mode
  const [controlMode, setControlMode] = useState("manual"); // "manual" | "replay" | "agent"

  // Connect WebSocket only on button press
  const handleConnect = () => {
    if (!socket.connected) {
      socket.connect();
    }
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
      replayController.currentActionRef.current = manualKeys;
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
        recordingBufferRef={replayController.recordingBufferRef}
        isRecordingActiveRef={replayController.isRecordingActiveRef}
        frameResetRef={frameResetRef}
        timerRef={timerRef}
        currentActionRef={replayController.currentActionRef}
        controlMode={controlMode}
      />
      <HUDView />
      <MiniMapHUD />
      <AgentDashboard
        isConnected={isConnected}
        replays={replayController.replays}
        errorMessage={replayController.errorMessage}
        successMessage={replayController.successMessage}
        onConnect={handleConnect}
        onFetchReplays={replayController.handleFetchReplays}
        resetScene={handleResetScene}
        COLAB_API_URL={replayController.COLAB_API_URL}
        onStartRecording={replayController.handleStartRecording}
        onStopRecording={replayController.handleStopRecording}
        onSaveReplay={replayController.handleSaveReplay}
        replayFilename={replayController.replayFilename}
        setReplayFilename={replayController.setReplayFilename}
        liveStateRef={liveStateRef}
        timerRef={timerRef}
        selectedReplay={replayController.selectedReplay}
        setSelectedReplay={replayController.setSelectedReplay}
        isReplayPlaying={replayController.isReplayPlaying}
        onStartReplay={replayController.handleStartReplay}
        onStopReplay={replayController.handleStopReplay}
        controlMode={controlMode}
        setControlMode={setControlMode}
      />
    </div>
  );
}

export default V2_App;