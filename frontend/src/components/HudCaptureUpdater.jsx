import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const HudCaptureUpdater = ({ robotCameraRef, miniMapCameraRef, onUpdate }) => {
  const frameSkip = useRef(0);

  useFrame(() => {
    frameSkip.current++;

    // Throttle updates if needed (e.g., every 2 frames)
    if (frameSkip.current % 2 !== 0) return;

    const hudImage = robotCameraRef?.current?.getHudImage?.();
    const miniMapImage = miniMapCameraRef?.current?.getHudImage?.();

    onUpdate({ hudImage, miniMapImage });
  });

  return null;
};

export default HudCaptureUpdater;