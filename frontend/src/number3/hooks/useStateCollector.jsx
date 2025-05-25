import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const useStateCollector = ({
  robotPositionRef,
  robotRotationRef,
  keysPressed,
  collisionIndicator,
  liveStateRef,
  recordingBufferRef = { current: [] },
  isRecordingActiveRef = { current: false },
  frameResetRef = null,
  timerRef,
  objectsInViewRef
}) => {
  const frameNumberRef = useRef(0);
  const keyDurationsRef = useRef({});

  // ✅ Expose a reset method
  if (frameResetRef) {
    frameResetRef.current = () => {
      frameNumberRef.current = 0;
      keyDurationsRef.current = {}; // Also reset key durations
    };
  }

  useFrame((_, delta) => {
    frameNumberRef.current += 1;

    // ⏱️ Track how long each key is held
    for (const key in keysPressed.current) {
      if (keysPressed.current[key]) {
        keyDurationsRef.current[key] = (keyDurationsRef.current[key] || 0) + delta;
      } else {
        keyDurationsRef.current[key] = 0;
      }
    }

    const currentActions = Object.entries(keysPressed.current)
      .filter(([key, val]) => val)
      .map(([key]) => key);

    const currentState = {
      robot_pos: robotPositionRef.current,
      robot_rot: robotRotationRef.current,
      currentActions,
      key_durations: { ...keyDurationsRef.current },
      detectedObjects: Array.isArray(liveStateRef.current.detectedObjects)
  ? [...liveStateRef.current.detectedObjects]
  : [],
      objectsInView: Array.isArray(objectsInViewRef?.current) && objectsInViewRef.current.length > 0
  ? [objectsInViewRef.current[0]]
  : [],
      collision: collisionIndicator.current,
      target_object: liveStateRef.current?.target_object || "",
      frame_number: frameNumberRef.current,
      time_left: timerRef?.current ?? null,
      frameTime: delta,
    };

    // ✅ Mutate the same object (required for Dashboard updates)
    Object.assign(liveStateRef.current, currentState);

    // ✅ Push after state is ready
    if (isRecordingActiveRef.current) {
      recordingBufferRef.current.push({ ...currentState });
    }
  });
};

export default useStateCollector;
