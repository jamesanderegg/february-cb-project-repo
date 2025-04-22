import React, { useEffect, useCallback } from 'react';
import { Quaternion, Euler } from 'three';

const DirectReplayController = ({
  COLAB_API_URL,
  socketRef,
  buggyRef,
  robotPositionRef,
  robotRotationRef,
  keysPressed,
  currentActionRef,
  lastVActionTime,
  setReplayPositions,
  resetScene
}) => {
  // Handle replay selection - load objects and start replay
  const handleReplaySelection = useCallback(async (replayName) => {
    if (!replayName) return;
    
    console.log(`🎮 Loading replay: ${replayName}`);
    
    try {
      // 1. Load object positions
      const objectsResponse = await fetch(`${COLAB_API_URL}/get_replay_objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
      const objectsData = await objectsResponse.json();
      
      // Extract object positions from possible formats
      let objectPositions = null;
      if (objectsData.objectPositions && Array.isArray(objectsData.objectPositions)) {
        objectPositions = objectsData.objectPositions;
      } 
      else if (objectsData.object_positions && Array.isArray(objectsData.object_positions)) {
        objectPositions = objectsData.object_positions;
      }
      else if (Array.isArray(objectsData)) {
        objectPositions = objectsData;
      }
      
      if (objectPositions && objectPositions.length > 0) {
        console.log(`✅ Found ${objectPositions.length} object positions`);
        
        // Process and set object positions
        const processedObjects = objectPositions.map(obj => ({
          ...obj,
          id: obj.id || obj.name || `object-${Math.random().toString(36).substring(2, 9)}`,
          position: obj.position || [0, 0, 0],
          rotation: obj.rotation || [0, 0, 0],
          scale: obj.scale || 1,
          physicsProps: {
            mass: obj.mass || obj.physicsProps?.mass || 1,
            type: 'dynamic',
            linearDamping: obj.linearDamping || obj.physicsProps?.linearDamping || 0.5,
            angularDamping: obj.angularDamping || obj.physicsProps?.angularDamping || 0.5,
            friction: obj.friction || obj.physicsProps?.friction || 0.7,
            restitution: obj.restitution || obj.physicsProps?.restitution || 0
          }
        }));
        
        setReplayPositions(processedObjects);
        
        // Wait for objects to be positioned before resetting scene
        await new Promise(resolve => setTimeout(resolve, 1000));
        resetScene();
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // 2. Load and start replay
      await fetch(`${COLAB_API_URL}/load_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
      console.log("▶️ Starting replay");
      await fetch(`${COLAB_API_URL}/start_replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: replayName })
      });
      
    } catch (error) {
      console.error("❌ Error starting replay:", error);
    }
  }, [COLAB_API_URL, setReplayPositions, resetScene]);
  
  // Handle replay action
  const handleReplayAction = useCallback((data) => {
    if (!data) return;
    
    // Extract action and state
    const action = data.action || [];
    const state = data.state || [];
    
    // 1. Update key presses
    if (keysPressed && keysPressed.current) {
      // Reset all keys first
      Object.keys(keysPressed.current).forEach(k => {
        keysPressed.current[k] = false;
      });
      
      // Set active keys
      action.forEach(key => {
        if (key && typeof key === 'string') {
          keysPressed.current[key] = true;
          
          // Special handling for 'v' key
          if (key === 'v' && lastVActionTime) {
            lastVActionTime.current = Date.now();
          }
        }
      });
      
      // Update current action reference
      if (currentActionRef) {
        currentActionRef.current = [...action];
      }
    }
    
    // 2. DIRECTLY update robot position and rotation from state
    if (state && state.length >= 6) {
      const position = state.slice(0, 3);
      const rotation = state.slice(3, 6);
      
      // Update ref values
      if (robotPositionRef) {
        robotPositionRef.current = [...position];
      }
      
      if (robotRotationRef) {
        if (robotRotationRef.current.length >= 4) {
          robotRotationRef.current = [...rotation, robotRotationRef.current[3]];
        } else {
          robotRotationRef.current = [...rotation];
        }
      }
      
      // CRITICAL: Directly update the RigidBody
      if (buggyRef && buggyRef.current && buggyRef.current.setTranslation) {
        // Force update position
        buggyRef.current.setTranslation({ 
          x: position[0], 
          y: position[1], 
          z: position[2] 
        }, true);
        
        // Convert Euler angles to quaternion for rotation
        const euler = new Euler(rotation[0], rotation[1], rotation[2]);
        const quaternion = new Quaternion().setFromEuler(euler);
        
        // Force update rotation
        buggyRef.current.setRotation(quaternion, true);
        
        // Reset velocities to prevent physics from interfering
        buggyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        buggyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  }, [buggyRef, robotPositionRef, robotRotationRef, keysPressed, currentActionRef, lastVActionTime]);
  
  // Define global startReplay function immediately
  useEffect(() => {
    console.log("🚀 DirectReplayController mounted");
    window.startReplay = handleReplaySelection;
    console.log("🔄 window.startReplay function defined:", typeof window.startReplay);
    
    return () => {
      delete window.startReplay;
    };
  }, [handleReplaySelection]);
  
  // Set up socket event listeners once socket is available
  useEffect(() => {
    if (!socketRef || !socketRef.current) return;
    
    const socket = socketRef.current;
    socket.on('replay_action', handleReplayAction);
    socket.on('replay_complete', () => {
      // Reset key presses
      if (keysPressed && keysPressed.current) {
        Object.keys(keysPressed.current).forEach(k => {
          keysPressed.current[k] = false;
        });
      }
      
      // Reset current action
      if (currentActionRef && currentActionRef.current) {
        currentActionRef.current = [];
      }
    });
    
    return () => {
      socket.off('replay_action', handleReplayAction);
      socket.off('replay_complete');
    };
  }, [socketRef, handleReplayAction, keysPressed, currentActionRef]);
  
  // This component doesn't render anything
  return null;
};

export default DirectReplayController;