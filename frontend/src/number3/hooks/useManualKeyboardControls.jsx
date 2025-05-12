import { useEffect } from "react";

export default function useManualKeyboardControls(keysPressedRef, isManualControlRef) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isManualControlRef.current) return;
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      if (!isManualControlRef.current) return;
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keysPressedRef, isManualControlRef]);
}
