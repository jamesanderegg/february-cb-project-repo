import { useEffect } from 'react';

export function useCountdownTimer(timerRef, isRunningRef = { current: true }, intervalMs = 1000, defaultTime = 350) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunningRef.current) return;

      if (timerRef.current > 0) {
        timerRef.current -= 1;
      }

      if (timerRef.current === 0) {
        console.log("⏰ Timer expired — resetting scene and restarting timer");
        window.dispatchEvent(new CustomEvent("sceneReset"));
        timerRef.current = defaultTime; // 🔁 Restart timer
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);
}