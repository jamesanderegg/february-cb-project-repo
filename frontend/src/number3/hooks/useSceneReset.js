import { useEffect, useRef } from 'react';

export function useSceneReset({
  // Direct component refs (managed at SceneEnvironment level)
  buggyRef,
  randomizerRef,

  // State and tracking refs
  timerRef,
  frameResetRef,
  recordingBufferRef,
  keysPressed,
  currentActionRef,
  collisionIndicator,
  isRecordingActiveRef,
  liveStateRef,

  // Callbacks for external coordination
  onResetStart = () => {},
  onResetComplete = () => {}
}) {
  const lastResetTimeRef = useRef(0);

  const executeSceneReset = (suppressObjectReset = false) => {
    console.log("🔄 Scene Reset: Starting coordination...");
    onResetStart();

    // === IMMEDIATE CLEANUP ===

    // Stop any active recording
    if (isRecordingActiveRef?.current) {
      console.log("🛑 Scene Reset: Stopping active recording");
      isRecordingActiveRef.current = false;
    }

    // Clear input state
    if (keysPressed?.current) {
      keysPressed.current = {};
    }
    if (currentActionRef?.current) {
      currentActionRef.current = [];
    }

    // Clear collision state
    if (collisionIndicator?.current !== undefined) {
      collisionIndicator.current = false;
    }

    // === DISPATCH COMPONENT-SPECIFIC RESET EVENTS ===
    console.log("📡 Scene Reset: Dispatching component reset events...");

    // Timer reset
    window.dispatchEvent(new CustomEvent('timerReset', {
      detail: { resetValue: 350 }
    }));

    // Buggy reset
    window.dispatchEvent(new CustomEvent('buggyReset', {
      detail: { 
        position: [7, 0.1, 15],
        rotation: [0, -Math.PI / 2, 0]
      }
    }));

    // ✅ Skip object reset if suppressObjectReset is true
    if (!suppressObjectReset) {
      window.dispatchEvent(new CustomEvent('objectsReset', {
        detail: { regenerate: true }
      }));
    }

    // State tracking
    window.dispatchEvent(new CustomEvent('stateReset', {
      detail: { frameNumber: 0 }
    }));

    // Completion
    console.log("✅ Scene Reset: Coordination complete");

    window.dispatchEvent(new CustomEvent('sceneResetComplete'));
    onResetComplete();
  };

  const handleCollisionReset = (event) => {
    const now = Date.now();
    if (now - lastResetTimeRef.current < 1500) return; // Cooldown
    lastResetTimeRef.current = now;

    const collidedWith = event.detail?.collidedWith || 'unknown';
    console.log("🚨 Collision Reset: Triggered by collision with", collidedWith);

    // Handle collision-specific recording logic
    if (isRecordingActiveRef?.current && liveStateRef?.current) {
      const lastFrame = { ...liveStateRef.current, collision: true };
      const buffer = recordingBufferRef?.current;

      if (buffer && (!buffer.length || !buffer[buffer.length - 1].collision)) {
        buffer.push(lastFrame);
        console.log("📹 Collision Reset: Added collision frame to recording");
      }
    }

    // Dispatch collision-specific reset event
    window.dispatchEvent(new CustomEvent('collisionReset', {
      detail: { collidedWith, frameNumber: liveStateRef?.current?.frame_number }
    }));

    executeSceneReset(true); // ✅ suppressObjectReset = true for collisions
  };

  useEffect(() => {
    const handleSceneReset = () => {
      console.log("📨 Scene Reset: Received sceneReset event");
      executeSceneReset(); // Default full reset
    };

    const handleCollision = (event) => {
      console.log("📨 Scene Reset: Received robotCollision event");
      handleCollisionReset(event);
    };

    window.addEventListener('sceneReset', handleSceneReset);
    window.addEventListener('robotCollision', handleCollision);

    console.log("👂 Scene Reset: Event listeners registered");

    return () => {
      window.removeEventListener('sceneReset', handleSceneReset);
      window.removeEventListener('robotCollision', handleCollision);
      console.log("🔇 Scene Reset: Event listeners removed");
    };
  }, []);

  return {
    triggerReset: executeSceneReset,
    lastResetTime: lastResetTimeRef.current,
  };
}
