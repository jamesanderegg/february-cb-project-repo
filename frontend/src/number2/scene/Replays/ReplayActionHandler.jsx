import React, { useEffect, useCallback } from 'react';
import { Quaternion, Euler } from 'three';

const ReplayActionHandler = ({
  COLAB_API_URL,
  socketRef,
  buggyRef,
  robotPositionRef,
  robotRotationRef,
  keysPressed,
  currentActionRef,
  lastVActionTime
}) => {
  // Handle the actions part of replay
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
  
  // Load and start replay actions
  const startReplayActions = useCallback(async (replayName) => {
    if (!replayName) return;
    
    try {
      // Load and start replay
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
      
      return true;
    } catch (error) {
      console.error("❌ Error starting replay actions:", error);
      return false;
    }
  }, [COLAB_API_URL]);
  
  // Define global startReplayActions function
  useEffect(() => {
    console.log("🚀 ReplayActionHandler mounted");
    window.startReplayActions = startReplayActions;
    console.log("🔄 window.startReplayActions function defined:", typeof window.startReplayActions);
    
    return () => {
      delete window.startReplayActions;
    };
  }, [startReplayActions]);
  
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

export default ReplayActionHandler;