import { useState, useCallback, useRef } from 'react';

export function useCollisionSystem({
  isRecordingActiveRef,
  recordingBufferRef,
  liveStateRef,
  setSuccessMessage,
  setErrorMessage,
  onSceneReset
}) {
  const [collisionState, setCollisionState] = useState(false);
  const lastResetTimeRef = useRef(0);
  
  const handleCollision = useCallback((collidedWith) => {
    const now = Date.now();
    if (now - lastResetTimeRef.current < 1500) return; // Collision cooldown
    lastResetTimeRef.current = now;

    console.log("💥 Collision detected with:", collidedWith);
    
    // ✅ Step 1: Set collision state immediately
    setCollisionState(true);
    
    // ✅ Step 2: Stop recording if active and preserve data
    if (isRecordingActiveRef?.current) {
      // Capture final collision frame
      const lastFrame = { 
        ...liveStateRef.current, 
        collision: true,
        collisionTarget: collidedWith,
        timestamp: now
      };
      
      if (recordingBufferRef?.current) {
        recordingBufferRef.current.push(lastFrame);
        console.log("📹 Added collision frame to recording");
      }
      
      // Stop recording
      isRecordingActiveRef.current = false;
      const framesRecorded = recordingBufferRef.current?.length || 0;
      
      // Add termination metadata
      recordingBufferRef.current?.push({
        type: 'collision_termination',
        timestamp: now,
        reason: 'Recording terminated due to collision',
        total_frames: framesRecorded,
        collision_frame: true
      });
      
      setSuccessMessage(`Recording stopped due to collision. ${framesRecorded} frames recorded.`);
      setErrorMessage('This recording ended due to collision - valuable for training!');
    }
    
    // ✅ Step 3: Trigger scene reset after short delay
    setTimeout(() => {
      onSceneReset?.();
      
      // ✅ Step 4: Clear collision state after reset completes
      setTimeout(() => {
        setCollisionState(false);
        console.log("🔄 Collision state cleared");
      }, 100);
    }, 50);
    
  }, [isRecordingActiveRef, recordingBufferRef, liveStateRef, setSuccessMessage, setErrorMessage, onSceneReset]);

  const resetCollisionState = useCallback(() => {
    setCollisionState(false);
  }, []);

  return {
    collisionState,
    handleCollision,
    resetCollisionState
  };
}