import React, { useEffect, useCallback } from 'react';

const ReplayObjectPositions = ({
  COLAB_API_URL,
  setReplayPositions,
  resetScene
}) => {
  // Handle replay selection - load objects and reset scene
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
      
      return true; // Return success status
      
    } catch (error) {
      console.error("❌ Error loading replay objects:", error);
      return false; // Return failure status
    }
  }, [COLAB_API_URL, setReplayPositions, resetScene]);
  
  // Define global loadReplayObjects function
  useEffect(() => {
    console.log("🚀 ReplayObjectPositions component mounted");
    window.loadReplayObjects = handleReplaySelection;
    console.log("🔄 window.loadReplayObjects function defined:", typeof window.loadReplayObjects);
    
    return () => {
      delete window.loadReplayObjects;
    };
  }, [handleReplaySelection]);

  // This component doesn't render anything
  return null;
};

export default ReplayObjectPositions;