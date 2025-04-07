import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { prepareActionPayload } from '../ActionHandler';

const GameLoop = ({
  // Timer-related props
  timerRef,
  timerIntervalRef,
  resetScene,
  
  // Robot-related refs
  robotRef,
  robotPositionRef,
  robotRotationRef,
  collisionIndicator,
  currentActionRef,
  
  // Camera-related refs
  robotCameraRef,
  
  // YOLO processing props
  YOLOdetectObject,
  onCaptureImage,
  
  // WebSocket props
  socket,
  objectsInViewRef,
  targetRef,
  
  // Action handling props
  keysPressed,
  keyDurations,
  lastVActionTime,
  
  // Other refs
  isProcessingRef,
  COLAB_API_URL
}) => {
  // Frame counter for throttling operations
  const frameCounter = useRef(0);
  const yoloProcessingInterval = 30; // Process YOLO every 30 frames
  
  // Reduce websocket update interval to capture more state changes
  const websocketUpdateInterval = 3;
  
  // Keep track of collision state for logging changes
  const lastCollisionState = useRef(false);
  
  // Keep track of recording status
  const isRecordingRef = useRef(false);
  
  // Keep track of V key press
  const lastVKeyState = useRef(false);
  
  // Keep track of timer state
  const lastTimerValue = useRef(timerRef?.current || 350);
  
  // Track the last state to detect significant changes
  const lastStateRef = useRef({
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    collision: false,
    actions: []
  });


  
  // Auto-stop recording function
  const autoStopRecording = useCallback((reason) => {
    // Only attempt to stop if we're actually recording
    if (!window.isRecordingActive) {
      return;
    }
    
    console.log(`🛑 Auto-stopping recording due to: ${reason}`);
    
    // Update recording state
      // 🚨 Send final state first
    sendImmediateStateUpdate();
    window.isRecordingActive = false;
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
      detail: { 
        isRecording: false,
        autoStopped: true,
        reason: reason
      }
    }));
    
    // Call the API endpoint to stop recording
    fetch(`${COLAB_API_URL}/stop_recording`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auto_stopped: true,
        reason: reason
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`✅ Recording auto-stopped successfully: ${reason}`);
    })
    .catch(error => {
      console.error(`❌ Error auto-stopping recording: ${error}`);
    });
  }, [COLAB_API_URL]);


  useEffect(() => {
    const handleSceneReset = () => {
      if (window.isRecordingActive) {
        console.log("🛑 Scene reset detected inside GameLoop - auto-stopping recording");
        sendImmediateStateUpdate();
        autoStopRecording("scene_reset");
      }
    };
  
    window.addEventListener("sceneReset", handleSceneReset);
  
    return () => {
      window.removeEventListener("sceneReset", handleSceneReset);
    };
  }, [autoStopRecording]);


  // Helper function to check if two arrays are equal
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const sendImmediateStateUpdate = () => {
    if (!socket || !socket.connected) return;
  
    const currentActions = currentActionRef?.current || [];
  
    const currentState = prepareActionPayload({
      currentActions: currentActions,
      keyDurations: keyDurations?.current || {},
      robotPosition: robotPositionRef?.current || [0, 0, 0],
      robotRotation: robotRotationRef?.current || [0, 0, 0, 1],
      collision: Boolean(collisionIndicator?.current),
      detectedObjects: YOLOdetectObject?.current || [],
      timeLeft: timerRef?.current || 350,
      targetObject: targetRef?.current || null,
      objectsInView: objectsInViewRef?.current || [],
      frameNumber: frameCounter.current
    });
  
    socket.emit("state", currentState);
    console.log("📤 Immediate state update sent before auto-stop!");
  
    lastStateRef.current = {
      position: [...currentState.robot_pos],
      rotation: [...currentState.robot_rot],
      collision: currentState.collision,
      actions: [...currentActions]
    };
  };
  
  
  // Use the useFrame hook to create our game loop
  useFrame((state, delta) => {
    frameCounter.current += 1;
    
    // Check if we're currently recording
    const isRecording = window.isRecordingActive === true;
    
    // Check for recording state changes
    if (isRecording !== isRecordingRef.current) {
      isRecordingRef.current = isRecording;
      console.log(`🎬 Recording state changed to: ${isRecording ? 'active' : 'inactive'}`);
    }
    
    // Only check for auto-stop conditions if we're recording
    if (isRecording) {
      // ===== AUTO-STOP CONDITION 1: COLLISION =====
      const currentCollision = Boolean(collisionIndicator?.current);
      if (currentCollision && !lastCollisionState.current) {
        console.log("🚨 COLLISION DETECTED! Auto-stopping recording...");
        sendImmediateStateUpdate(); // send state BEFORE stopping
        autoStopRecording('collision');
      }
      lastCollisionState.current = currentCollision;
      
      // ===== AUTO-STOP CONDITION 2: V KEY PRESS (PICTURE TAKEN) =====
      const vKeyPressed = Boolean(keysPressed.current['v']);
      const now = Date.now();
      if (vKeyPressed && now - lastVActionTime.current > 500) {
        console.log("📸 Picture taken! Auto-stopping recording...");
        sendImmediateStateUpdate(); // send state BEFORE stopping
        autoStopRecording('picture_taken');
      }
      lastVKeyState.current = vKeyPressed;
      
      // ===== AUTO-STOP CONDITION 3: TIMER RUNNING OUT =====
      const currentTimer = timerRef?.current || 0;
      if (lastTimerValue.current > 0 && currentTimer <= 0) {
        console.log("⏱️ Timer reached zero! Auto-stopping recording...");
        sendImmediateStateUpdate(); // send state BEFORE stopping
        autoStopRecording('time_expired');
      }
      
      lastTimerValue.current = currentTimer;
    }
    
    // Regular game loop operations (existing code)
    if (frameCounter.current % yoloProcessingInterval === 0 && 
        robotCameraRef.current && 
        !isProcessingRef.current) {
      const image = robotCameraRef.current.getHudImage();
      
      if (image) {
        // Convert data URL to blob
        fetch(image)
          .then(res => res.blob())
          .then(blob => {
            if (onCaptureImage) {
              onCaptureImage(blob);
            }
          });
      }
    }
    
    // Create state object to send via WebSocket with explicit boolean collision
    const currentActions = currentActionRef?.current || [];
   
    const currentState = prepareActionPayload({
      currentActions: currentActions,
      keyDurations: keyDurations?.current || {},
      robotPosition: robotPositionRef?.current || [0, 0, 0],
      robotRotation: robotRotationRef?.current || [0, 0, 0, 1],
      collision: Boolean(collisionIndicator?.current),
      detectedObjects: YOLOdetectObject?.current || [],
      timeLeft: timerRef?.current || 350,
      targetObject: targetRef?.current || null,
      objectsInView: objectsInViewRef?.current || [],
      frameNumber: frameCounter.current
    });
    
    // Check if any important state changed since last update
    const hasCollisionChanged = currentState.collision !== lastStateRef.current.collision;
    const hasActionChanged = !arraysEqual(currentActions, lastStateRef.current.actions);
    const hasPositionChanged = !arraysEqual(currentState.robot_pos, lastStateRef.current.position);
    
    // Always send updates on the normal websocket interval
    const shouldSendNormalUpdate = frameCounter.current % websocketUpdateInterval === 0;
    
    // Send the state via WebSocket if it's time or if important state changed`
    if (shouldSendNormalUpdate || (isRecordingRef.current && (hasCollisionChanged || hasActionChanged || hasPositionChanged))) {
      if (socket && socket.connected) {
        
        socket.emit("state", currentState);
        console.log(currentState)
        // Log significant state changes
        if (hasCollisionChanged) {
          console.log(`🚨 Sending state update with collision change: ${currentState.collision}`);
        }
        // ***************************************************************************This is weird
        if (hasActionChanged && isRecordingRef.current) {
          const actionStr = currentActions.length > 0 ? currentActions.join(', ') : 'none';
          console.log(`🎮 Action changed during recording: ${actionStr}`);
          
          // Log key durations for active keys
          const activeDurations = Object.entries(currentState.key_durations)
            .filter(([key, duration]) => duration > 0)
            .map(([key, duration]) => `${key}:${duration}`)
            .join(', ');
            
          if (activeDurations) {
            console.log(`⌨️ Key durations: ${activeDurations}`);
          }
        }
        
        // Update our last known state
        lastStateRef.current = {
          position: [...currentState.robot_pos],
          rotation: [...currentState.robot_rot],
          collision: currentState.collision,
          actions: [...currentActions]
        };
      }
    }
    
    // Reset frame counter to prevent potential numeric overflow
    if (frameCounter.current > 1000) {
      frameCounter.current = 0;
    }
  });
  
  // Initialize state tracking on mount
  useEffect(() => {
    if (collisionIndicator) {
      lastCollisionState.current = Boolean(collisionIndicator.current);
    }
    
    if (timerRef) {
      lastTimerValue.current = timerRef.current;
    }
    
    // Listen for recording status changes
    const handleRecordingStatusChange = (event) => {
      if (event && event.detail && typeof event.detail.isRecording === 'boolean') {
        window.isRecordingActive = event.detail.isRecording;
        console.log(`🎬 Recording status changed to: ${window.isRecordingActive ? 'active' : 'inactive'}`);
      }
    };
    
    window.addEventListener('recordingStatusChanged', handleRecordingStatusChange);
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleRecordingStatusChange);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default GameLoop;