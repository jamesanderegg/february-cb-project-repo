import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

// This component will handle the game loop within the Canvas
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
  const websocketUpdateInterval = 10; // Send websocket updates every 10 frames
  const yoloProcessingInterval = 30; // Process YOLO every 30 frames
  
  // Keep track of collision state for logging changes
  const lastCollisionState = useRef(false);
  
  // Keep track of recording status (for debugging)
  const isRecordingRef = useRef(false);
  
  // Use the useFrame hook to create our game loop
  useFrame((state, delta) => {
    frameCounter.current += 1;
    
    // Check if collision state changed
    const currentCollision = Boolean(collisionIndicator?.current);
    if (currentCollision !== lastCollisionState.current) {
      console.log(`🔄 Collision state changed: ${lastCollisionState.current} -> ${currentCollision}`);
      
      // If collision just occurred, log it prominently
      if (currentCollision) {
        console.log("🚨 COLLISION DETECTED! Will be sent via WebSocket");
      }
      
      // Update last state
      lastCollisionState.current = currentCollision;
    }
    
    // Handle YOLO processing (throttled)
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
    
    // Send WebSocket state (throttled)
    if (frameCounter.current % websocketUpdateInterval === 0 && socket && socket.connected) {
      // Get currently pressed keys (for recording)
      const pressedKeys = {};
      for (const [key, value] of Object.entries(keysPressed.current || {})) {
        if (value) {
          pressedKeys[key] = true;
        }
      }
      
      // Create state object to send via WebSocket with explicit boolean collision
      const stateToSend = {
        robot_pos: robotPositionRef.current || [0, 0, 0],
        robot_rot: robotRotationRef.current || [0, 0, 0, 1],
        detectedObjects: YOLOdetectObject?.current || [],
        objectsInView: objectsInViewRef.current || [],
        collision: Boolean(collisionIndicator?.current), // Ensure collision is boolean
        currentActions: currentActionRef.current || [],
        time_left: timerRef.current || 350,
        target_object: targetRef.current || null,
        frame_number: frameCounter.current, // Include frame number for tracking
        key_state: pressedKeys // Include pressed keys for replay recording
      };
      
      // Check if we're recording (for debug messages)
      const isRecording = window.isRecordingActive === true;
      if (isRecording !== isRecordingRef.current) {
        isRecordingRef.current = isRecording;
        console.log(`🎬 Recording state changed to: ${isRecording ? 'active' : 'inactive'}`);
      }
      
      // Add debug info for recording
      if (isRecording && frameCounter.current % 100 === 0) { // Every 100 frames
        console.log(`📊 Recording frame ${frameCounter.current} with keys:`, 
          Object.keys(pressedKeys).length > 0 ? Object.keys(pressedKeys) : "none");
      }
      
      // Log the state if collision is true
      if (stateToSend.collision) {
        console.log("💥 Sending collision=true via WebSocket state:", stateToSend);
      }
      
      // Send the state via WebSocket
      socket.emit("state", stateToSend);
      
      // If collision just occurred, also send a dedicated collision event
      if (stateToSend.collision && !lastCollisionState.current) {
        const collisionEvent = {
          ...stateToSend,
          timestamp: Date.now(),
          event_type: 'collision',
        };
        
        console.log("🔴 Sending dedicated collision event via WebSocket");
        socket.emit("collision_event", collisionEvent);
      }
    }
    
    // Reset frame counter to prevent potential numeric overflow in long sessions
    if (frameCounter.current > 1000) {
      frameCounter.current = 0;
    }
  });
  
  // Initialize lastCollisionState on mount
  useEffect(() => {
    if (collisionIndicator) {
      lastCollisionState.current = Boolean(collisionIndicator.current);
    }
    
    // Listen for recording status changes
    const handleRecordingStatusChange = (event) => {
      if (event && event.detail && typeof event.detail.isRecording === 'boolean') {
        window.isRecordingActive = event.detail.isRecording;
        console.log(`🎬 Recording status changed to: ${window.isRecordingActive ? 'active' : 'inactive'}`);
      }
    };
    
    // Listen for recording status change events
    window.addEventListener('recordingStatusChanged', handleRecordingStatusChange);
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleRecordingStatusChange);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default GameLoop;