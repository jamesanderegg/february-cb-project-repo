import React, { useEffect, useCallback } from 'react';
import ReplayObjectPositions from './ReplayObjectPositions';
import ReplayActionHandler from './ReplayActionHandler';

const CombinedReplayController = (props) => {
  // Combines both components and provides a unified startReplay function
  const handleReplaySelection = useCallback(async (replayName) => {
    if (!replayName) return;
    
    console.log(`🎮 Starting combined replay: ${replayName}`);
    
    try {
      // First, load and position objects
      const objectsSuccess = await window.loadReplayObjects(replayName);
      
      if (objectsSuccess) {
        // Then, start the replay actions
        await window.startReplayActions(replayName);
      }
      
    } catch (error) {
      console.error("❌ Error in combined replay:", error);
    }
  }, []);
  
  // Define global startReplay function
  useEffect(() => {
    console.log("🚀 CombinedReplayController mounted");
    window.startReplay = handleReplaySelection;
    console.log("🔄 window.startReplay function defined:", typeof window.startReplay);
    
    return () => {
      delete window.startReplay;
    };
  }, [handleReplaySelection]);

  useEffect(() => {
    // Listen for replay completion to ensure isReplaying is properly reset
    const handleReplayStatusChange = (event) => {
      if (event && event.detail) {
        if (event.detail.type === 'complete' || event.detail.type === 'cancelled') {
          console.log('🚫 Ensuring replay mode is disabled');
          window.isReplaying = false;
        }
      }
    };
    
    window.addEventListener('recordingStatusChanged', handleReplayStatusChange);
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleReplayStatusChange);
    };
  }, []);
  
  return (
    <>
      <ReplayObjectPositions 
        COLAB_API_URL={props.COLAB_API_URL}
        setReplayPositions={props.setReplayPositions}
        resetScene={props.resetScene}
      />
      <ReplayActionHandler 
        COLAB_API_URL={props.COLAB_API_URL}
        socketRef={props.socketRef}
        buggyRef={props.buggyRef}
        robotPositionRef={props.robotPositionRef}
        robotRotationRef={props.robotRotationRef}
        keysPressed={props.keysPressed}
        currentActionRef={props.currentActionRef}
        lastVActionTime={props.lastVActionTime}
      />
    </>
  );
};

export default CombinedReplayController;