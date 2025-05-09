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
  // Handle replay socket events for actions
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
          
          // For "v" key (taking photo), also update lastVActionTime
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
    
    // 2. CRITICAL: Handle physics-based position & rotation updates
    if (state && state.length >= 6 && buggyRef && buggyRef.current) {
      const position = state.slice(0, 3);
      const rotation = state.slice(3, 6);
      
      // Update reference variables
      if (robotPositionRef) {
        robotPositionRef.current = [...position];
      }
      
      if (robotRotationRef) {
        if (robotRotationRef.current.length >= 4) {
          // Convert Euler to quaternion for rigid body
          const euler = new Euler(rotation[0], rotation[1], rotation[2]);
          const quat = new Quaternion().setFromEuler(euler);
          robotRotationRef.current = [quat.x, quat.y, quat.z, quat.w];
        } else {
          robotRotationRef.current = [...rotation];
        }
      }
      
      // CRITICAL FIX: Force update the RigidBody directly
      const rb = buggyRef.current;
      
      // Set global flag for replay mode to disable physics in useFrame
      window.isReplaying = true;
      
      // Direct position update
      if (typeof rb.setTranslation === 'function') {
        // Debug log
        console.log(`🤖 Updating robot position to:`, position);
        
        // Apply position update with wake parameter
        rb.setTranslation({
          x: position[0], 
          y: position[1], 
          z: position[2]
        }, true);
        
        // Zero out velocity to prevent physics interference
        if (typeof rb.setLinvel === 'function') {
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
      
      // Direct rotation update 
      if (typeof rb.setRotation === 'function') {
        // Convert to proper quaternion for physics
        const euler = new Euler(rotation[0], rotation[1], rotation[2]);
        const quat = new Quaternion().setFromEuler(euler);
        
        // Debug log
        console.log(`🔄 Updating robot rotation to:`, [quat.x, quat.y, quat.z, quat.w]);
        
        // Apply rotation update with wake parameter
        rb.setRotation(quat, true);
        
        // Zero out angular velocity
        if (typeof rb.setAngvel === 'function') {
          rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    }
  }, [buggyRef, robotPositionRef, robotRotationRef, keysPressed, currentActionRef, lastVActionTime]);
  
  // Set up socket event listeners once socket is available
  useEffect(() => {
    if (!socketRef || !socketRef.current) return;
    
    const socket = socketRef.current;
    
    console.log('🔊 Setting up replay action socket handlers');
    
    // Add event listeners
    socket.on('replay_action', handleReplayAction);
    
    // Handle end of replay
    socket.on('replay_complete', () => {
      console.log('✅ Replay complete - resetting keys and flags');
      
      // Clear replay mode flag
      window.isReplaying = false;
      
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
      // Clean up listeners
      socket.off('replay_action', handleReplayAction);
      socket.off('replay_complete');
      
      // Reset replay mode flag
      window.isReplaying = false;
    };
  }, [socketRef, handleReplayAction, keysPressed, currentActionRef]);
  
  // This component doesn't render anything
  return null;
};

export default ReplayActionHandler;