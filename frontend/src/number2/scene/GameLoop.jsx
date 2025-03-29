import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

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
  
  // Other refs
  isProcessingRef,
  lastVActionTime,
  keysPressed,
  COLAB_API_URL
}) => {
  // Frame counter for throttling operations
  const frameCounter = useRef(0);
  const yoloProcessingInterval = 30; // Process YOLO every 30 frames
  
  // Reduce websocket update interval to capture more state changes
  // Changed from 10 to 3 for more frequent updates
  const websocketUpdateInterval = 3;
  
  // Keep track of collision state for logging changes and detecting state changes
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
    keys: {}
  });
  
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
        autoStopRecording('collision');
      }
      lastCollisionState.current = currentCollision;
      
      // ===== AUTO-STOP CONDITION 2: V KEY PRESS (PICTURE TAKEN) =====
      const vKeyPressed = Boolean(keysPressed.current['v'] || keysPressed.current['V']);
      if (vKeyPressed && !lastVKeyState.current) {
        console.log("📸 Picture taken! Auto-stopping recording...");
        autoStopRecording('picture_taken');
      }
      lastVKeyState.current = vKeyPressed;
      
      // ===== AUTO-STOP CONDITION 3: TIMER RUNNING OUT =====
      const currentTimer = timerRef?.current || 0;
      if (lastTimerValue.current > 0 && currentTimer <= 0) {
        console.log("⏱️ Timer reached zero! Auto-stopping recording...");
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
    
    // Create state object to use for comparison and sending
    const currentState = {
      robot_pos: robotPositionRef.current || [0, 0, 0],
      robot_rot: robotRotationRef.current || [0, 0, 0, 1],
      detectedObjects: YOLOdetectObject?.current || [],
      objectsInView: objectsInViewRef.current || [],
      collision: Boolean(collisionIndicator?.current),
      currentActions: currentActionRef.current || [],
      time_left: timerRef.current || 350,
      target_object: targetRef.current || null,
      frame_number: frameCounter.current,
      key_state: {}
    };
    
    // Get currently pressed keys (for recording)
    for (const [key, value] of Object.entries(keysPressed.current || {})) {
      if (value) {
        currentState.key_state[key] = true;
      }
    }
    
    // Check if any important state changed since last update
    const hasCollisionChanged = currentState.collision !== lastStateRef.current.collision;
    const hasKeyStateChanged = !shallowEqual(currentState.key_state, lastStateRef.current.keys);
    
    // Always send updates on the normal websocket interval
    const shouldSendNormalUpdate = frameCounter.current % websocketUpdateInterval === 0;
    
    // Send state if it's time for a normal update OR if we're recording and there's an important state change
    if (shouldSendNormalUpdate || (isRecording && (hasCollisionChanged || hasKeyStateChanged))) {
      if (socket && socket.connected) {
        // Send the state via WebSocket
        socket.emit("state", currentState);
        
        // If this is a collision change, log it prominently
        if (hasCollisionChanged) {
          console.log(`🚨 Sending state update with collision change: ${currentState.collision}`);
        }
        
        // Update last state
        lastStateRef.current = {
          position: [...currentState.robot_pos],
          rotation: [...currentState.robot_rot],
          collision: currentState.collision,
          keys: {...currentState.key_state}
        };
      }
    }
    
    // Reset frame counter to prevent potential numeric overflow
    if (frameCounter.current > 1000) {
      frameCounter.current = 0;
    }
  });
  
  // Function to automatically stop recording
  const autoStopRecording = (reason) => {
    // Only attempt to stop if we're actually recording
    if (!window.isRecordingActive) {
      return;
    }
    
    console.log(`🛑 Auto-stopping recording due to: ${reason}`);
    
    // Update recording state
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
  };

  // Helper function to check if two key state objects are equal
  function shallowEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
    
    return true;
  }
  
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