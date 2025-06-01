import { useEffect } from "react";

export default function useManualKeyboardControls(keysPressedRef,
  controlModeRef,
  {
    liveStateRef,
    recordingBufferRef,
    handleStopRecording
  } = {}) {

  useEffect(() => {
  const handleKeyDown = (e) => {
    if (controlModeRef.current !== "manual") return;

    const key = e.key.toLowerCase();
    keysPressedRef.current[key] = true;

    if (key === "v" && handleStopRecording && recordingBufferRef?.current) {
      const lastFrame = {
        ...liveStateRef.current,
        currentActions: ['v']
      };

      // ✅ Add to buffer before stopping
      recordingBufferRef.current.push(lastFrame);

      // ⏹️ Stop recording
      handleStopRecording(false); // Not a collision
    }
  };

  const handleKeyUp = (e) => {
    if (controlModeRef.current !== "manual") return;
    keysPressedRef.current[e.key.toLowerCase()] = false;
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}, [controlModeRef, liveStateRef, recordingBufferRef, handleStopRecording]);


}
