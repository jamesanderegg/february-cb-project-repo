import React, { useState, useEffect, useCallback } from 'react';
import '../../../styles/ReplayController.css';

/**
 * ReplayController - Manages replay actions and state
 * This component can be used directly in the Main component to handle replay events
 */

const ReplayController = ({ 
  COLAB_API_URL,
  socketRef,
  robotRef,
  robotPositionRef,
  robotRotationRef,
  keysPressed,
  currentActionRef,
  lastVActionTime,
  onReplayComplete
}) => {
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // Handle replay actions from socket.io
  const handleReplayAction = useCallback((replayData) => {
    if (!replayData) return;
    
    // Extract action data
    const action = replayData.action;
    const step = replayData.step;
    const total = replayData.total_steps;
    const state = replayData.state;
    
    // Update replay state
    setIsReplaying(true);
    setCurrentStep(step);
    setTotalSteps(total);
    
    // Broadcast replay status
    window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
      detail: { 
        isReplaying: true,
        step: step,
        totalSteps: total,
        message: `Replaying step ${step + 1}/${total}`
      }
    }));
    
    // 1. Apply actions to simulate key presses
    if (action && Array.isArray(action)) {
      // First reset all keys
      if (keysPressed && keysPressed.current) {
        Object.keys(keysPressed.current).forEach(k => {
          keysPressed.current[k] = false;
        });
        
        // Then set active keys
        action.forEach(key => {
          if (key && typeof key === 'string') {
            keysPressed.current[key] = true;
            
            // Special handling for "v" key (photo)
            if (key === "v" && lastVActionTime) {
              lastVActionTime.current = Date.now();
            }
          }
        });
        
        // Update current action reference
        if (currentActionRef && currentActionRef.current) {
          currentActionRef.current = [...action];
        }
      }
    }
    
    // 2. Apply state changes (position, rotation)
    if (state && Array.isArray(state) && state.length >= 6) {
      const position = state.slice(0, 3);
      const rotation = state.slice(3, 6);
      
      // Update position reference
      if (robotPositionRef && robotPositionRef.current) {
        robotPositionRef.current = [...position];
      }
      
      // Update rotation reference
      if (robotRotationRef && robotRotationRef.current) {
        if (robotRotationRef.current.length >= 4) {
          // Handle quaternion format
          robotRotationRef.current = [...rotation, robotRotationRef.current[3]];
        } else {
          robotRotationRef.current = [...rotation];
        }
      }
      
      // Apply to robot directly if possible
      if (robotRef && robotRef.current) {
        if (robotRef.current.position) {
          robotRef.current.position.set(position[0], position[1], position[2]);
        }
        
        if (robotRef.current.rotation) {
          robotRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
      }
    }
  }, [robotRef, robotPositionRef, robotRotationRef, keysPressed, currentActionRef, lastVActionTime]);

  // Handle replay completion
  const handleReplayComplete = useCallback(() => {
    setIsReplaying(false);
    
    // Reset keys
    if (keysPressed && keysPressed.current) {
      Object.keys(keysPressed.current).forEach(k => {
        keysPressed.current[k] = false;
      });
    }
    
    // Clear current action
    if (currentActionRef && currentActionRef.current) {
      currentActionRef.current = [];
    }
    
    // Broadcast completion
    window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
      detail: { 
        type: 'complete',
        message: 'Replay complete'
      }
    }));
    
    // Call completion callback
    if (onReplayComplete) {
      onReplayComplete();
    }
  }, [keysPressed, currentActionRef, onReplayComplete]);

  // Set up socket.io event listeners
  useEffect(() => {
    if (!socketRef || !socketRef.current) return;
    
    const socket = socketRef.current;
    
    // Listen for replay events
    socket.on('replay_action', handleReplayAction);
    socket.on('replay_complete', handleReplayComplete);
    
    // Cleanup
    return () => {
      socket.off('replay_action', handleReplayAction);
      socket.off('replay_complete', handleReplayComplete);
    };
  }, [socketRef, handleReplayAction, handleReplayComplete]);

  // Cancel replay function
  const cancelReplay = useCallback(() => {
    if (!isReplaying) return;
    
    fetch(`${COLAB_API_URL}/cancel_replay`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        console.log('🛑 Replay cancelled:', data);
        setIsReplaying(false);
        
        // Reset everything
        if (keysPressed && keysPressed.current) {
          Object.keys(keysPressed.current).forEach(k => {
            keysPressed.current[k] = false;
          });
        }
        
        if (currentActionRef && currentActionRef.current) {
          currentActionRef.current = [];
        }
        
        // Broadcast cancellation
        window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
          detail: { 
            type: 'cancelled',
            message: 'Replay cancelled'
          }
        }));
      })
      .catch(error => {
        console.error('❌ Error cancelling replay:', error);
      });
  }, [COLAB_API_URL, isReplaying, keysPressed, currentActionRef]);

  // Component doesn't render anything visual
  return null;
};

export default ReplayController;