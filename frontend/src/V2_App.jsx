import React, { useState, useEffect, useRef, useCallback } from 'react';
import V2_MainCanvas from './number3/V2_MainCanvas';
import HUDView from "./number3/camera/V2_HUDView.jsx";
import MiniMapHUD from "./number3/camera/V2_MiniMapHUD.jsx";
import AgentDashboard from "./number3/controls/V2_AgentDashboard.jsx";
import { socket } from './number3/controls/socket.js';
import useReplayController from './number3/hooks/useReplayController.js';
import RobotStatePanel from './number3/controls/RobotStateHUD.jsx';

import './styles/App.css';

function V2_App() {
  const [isConnected, setIsConnected] = useState(false);
  const liveStateRef = useRef({});
  const [controlMode, setControlMode] = useState("manual");
  const replayStepTriggerRef = useRef(false);

  const robotPositionRef = useRef([0, 0, 0]);
  const robotRotationRef = useRef([0, 0, 0, 1]);
  const keysPressed = useRef({});
  const collisionIndicator = useRef(false);
  const frameResetRef = useRef(null);
  const timerRef = useRef(350);

  const modelPositionsRef = useRef({});
  const objectsInViewRef = useRef([]);

  const replayController = useReplayController(liveStateRef, replayStepTriggerRef, controlMode, robotPositionRef, robotRotationRef);
const topDownCameraRef = useRef();

  const [showDashboard, setShowDashboard] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [hudImage, setHudImage] = useState(null);
  const [targetObject, setTargetObject] = useState("");

const handleCaptureImage = useCallback((imageBlob) => {
  if (!imageBlob) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result;
    if (typeof base64 === 'string') {
      setHudImage(base64);
    }
  };
  reader.readAsDataURL(imageBlob);
}, []);


  const handleConnect = () => {
    if (!socket.connected) {
      socket.connect();
    }
  };

  const handleResetScene = () => {
    window.dispatchEvent(new CustomEvent('sceneReset'));
  };

  const handleSetReplayPositions = (positions) => {
    window.dispatchEvent(new CustomEvent('injectObjectPositions', { detail: positions }));
  };

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
    }, 50);

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
        setTargetObject={setTargetObject}
        replayStepTriggerRef={replayStepTriggerRef}
        modelPositionsRef={modelPositionsRef}
        objectsInViewRef={objectsInViewRef}
        onCaptureImage={handleCaptureImage}
        topDownCameraRef={topDownCameraRef}
      />
      <HUDView hudImage={hudImage} />

      <MiniMapHUD getMiniMapImage={() => topDownCameraRef.current?.getHudImage?.()} />

      <RobotStatePanel liveStateRef={liveStateRef} controlMode={controlMode} targetObject={targetObject} />

      <div className="dashboard-buttons">
        {/* <button className="unstyled-button" onClick={() => setShowStatus(prev => !prev)}>
          Status
        </button> */}
        <button className="unstyled-button" onClick={() => setShowDashboard(prev => !prev)}>
          Agent Dashboard
        </button>
      </div>

      {showDashboard && (
        <AgentDashboard
          className="agent-dashboard"
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
          onClose={() => setShowDashboard(false)}
          targetObject={targetObject}
        />
      )}

      {showStatus && (
        <AgentDashboard
          className="status-dashboard"
          isConnected={isConnected}
          liveStateRef={liveStateRef}
          activeTab="status"
          onClose={() => setShowStatus(false)}
        />
      )}
    </div>
  );
}

export default V2_App;
