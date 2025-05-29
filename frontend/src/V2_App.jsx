import React, { useState, useEffect, useRef, useCallback } from 'react';
import V2_MainCanvas from './number3/V2_MainCanvas';
import HUDView from "./number3/camera/V2_HUDView.jsx";
import MiniMapHUD from "./number3/camera/V2_MiniMapHUD.jsx";
import AgentDashboard from "./number3/controls/V2_AgentDashboard.jsx";
import { socket } from './number3/controls/socket.js';
import useReplayController from './number3/hooks/useReplayController.js';
import RobotStatePanel from './number3/controls/RobotStateHUD.jsx';

import useYoloDetection from './number3/hooks/useYoloDetection.js';

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

  const topDownCameraRef = useRef();
  const robotCameraRef = useRef();

  const [showDashboard, setShowDashboard] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [hudImage, setHudImage] = useState(null);
  const [targetObject, setTargetObject] = useState("");

  const [replayPositions, setReplayPositions] = useState(null);
  const [currentReplayTarget, setCurrentReplayTarget] = useState(null);

  const [showRobotState, setShowRobotState] = useState(true);


  const replayController = useReplayController(
    liveStateRef,
    replayStepTriggerRef,
    controlMode,
    robotPositionRef,
    robotRotationRef,
    setControlMode,
    modelPositionsRef,
    targetObject,
    setReplayPositions,
    setCurrentReplayTarget,
    collisionIndicator
  );

  useYoloDetection({
    liveStateRef,
    recordingBufferRef: replayController.recordingBufferRef,
    isRecordingActiveRef: replayController.isRecordingActiveRef,
    getCameraCanvas: () => robotCameraRef.current?.getCanvas?.(),  // ✅ real canvas
  });



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
    console.log("🎯 App: Triggering scene reset...");
    window.dispatchEvent(new CustomEvent('sceneReset'));
    setReplayPositions(null);
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

//   useEffect(() => {
//   const handleRobotCollision = (e) => {
//     console.log("🚨 Collision Event Triggered:", e.detail.collidedWith);

//     // ⛔ Prevent further manual input from lingering
//     keysPressed.current = {};
//     replayController.currentActionRef.current = [];

//     if (replayController.isRecordingActiveRef.current) {
//       const lastFrame = { ...liveStateRef.current, collision: true };
//       const buffer = replayController.recordingBufferRef.current;

//       if (!buffer.length || !buffer[buffer.length - 1].collision) {
//         buffer.push(lastFrame);
//       }

//       replayController.handleStopRecording();
//       alert(`🚨 Collision at frame ${lastFrame.frame_number}. Recording stopped.`);
//     }

//     window.dispatchEvent(new CustomEvent('sceneReset'));
//   };

//   window.addEventListener("robotCollision", handleRobotCollision);
//   return () => window.removeEventListener("robotCollision", handleRobotCollision);
// }, []);
  useEffect(() => {
    if (controlMode !== "manual") return;

    const interval = setInterval(() => {
      const manualKeys = Object.keys(keysPressed.current).filter(k => keysPressed.current[k]);
      replayController.currentActionRef.current = manualKeys;
    }, 50);

    return () => clearInterval(interval);
  }, [controlMode]);

  // Listen for scene reset completion (optional - for UI feedback)
  useEffect(() => {
    const handleResetComplete = () => {
      console.log("✅ App: Scene reset completed");
      // Could show success message, update UI state, etc.
    };

    window.addEventListener('sceneResetComplete', handleResetComplete);
    return () => window.removeEventListener('sceneResetComplete', handleResetComplete);
  }, []);

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
        robotCameraRef={robotCameraRef}
        replayPositions={replayPositions}
      />
      <HUDView hudImage={hudImage} />

      <MiniMapHUD getMiniMapImage={() => topDownCameraRef.current?.getHudImage?.()} />


      <div className="dashboard-buttons">
        <button className="unstyled-button" onClick={() => setShowRobotState(prev => !prev)}>
          Robot State
        </button>
        <button className="unstyled-button" onClick={() => setShowDashboard(prev => !prev)}>
          Agent Dashboard
        </button>
      </div>

      {showRobotState && (
        <RobotStatePanel
          liveStateRef={liveStateRef}
          controlMode={controlMode}
          targetObject={currentReplayTarget}
          objectsInViewRef={objectsInViewRef}
        />
      )}

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
          isRecordingActiveRef={replayController.isRecordingActiveRef}
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
