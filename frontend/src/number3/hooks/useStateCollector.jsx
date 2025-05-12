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
  frameResetRef = null
}) => {
  const frameNumberRef = useRef(0);

  // ✅ Expose a reset method
  if (frameResetRef) {
    frameResetRef.current = () => {
      frameNumberRef.current = 0;
    };
  }

  useFrame(() => {
    frameNumberRef.current += 1;

    const currentState = {
      robot_pos: robotPositionRef.current,
      robot_rot: robotRotationRef.current,
      currentActions: Object.entries(keysPressed.current)
        .filter(([key, val]) => val)
        .map(([key]) => key),
      key_durations: {},
      detectedObjects: [],
      objectsInView: [],
      collision: collisionIndicator.current,
      target_object: "cup",
      frame_number: frameNumberRef.current,
    };

    liveStateRef.current = currentState;

    if (isRecordingActiveRef.current) {
      recordingBufferRef.current.push({ ...currentState });
    }
  });
};

export default useStateCollector;
