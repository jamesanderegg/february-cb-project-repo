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
  
  // Use the useFrame hook to create our game loop
  useFrame((state, delta) => {
    frameCounter.current += 1;
    
    // 1. Update timer (already managed by timerIntervalRef in Main.jsx)
    
    // 2. Update movement (happens in Buggy.jsx via useFrame)
    
    // 3. Update camera (happens in RobotCamera.jsx via useFrame)
    
    // 4. Handle YOLO processing (throttled)
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
    
    // 5. Send WebSocket state (throttled)
    if (frameCounter.current % websocketUpdateInterval === 0 && socket && socket.connected) {
      const state = {
        robot_pos: robotPositionRef.current || [0, 0, 0],
        robot_rot: robotRotationRef.current || [0, 0, 0, 1],
        detectedObjects: YOLOdetectObject?.current || [],
        objectsInViewRef: objectsInViewRef.current || [],
        collision: collisionIndicator?.current || false,
        currentActionRef: currentActionRef.current || [],
        time_left: timerRef.current || 350,
        target_object: targetRef.current || null,
      };
      
      socket.emit("state", state);
    }
    
    // Reset frame counter to prevent potential numeric overflow in long sessions
    if (frameCounter.current > 1000) {
      frameCounter.current = 0;
    }
  });
  
  // This component doesn't render anything
  return null;
};

export default GameLoop;