import { useEffect } from "react";

export default function useManualKeyboardControls(keysPressedRef, controlModeRef) {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (controlModeRef.current !== "manual") return;
      keysPressedRef.current[e.key.toLowerCase()] = true;
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
  }, [controlModeRef]);

}
