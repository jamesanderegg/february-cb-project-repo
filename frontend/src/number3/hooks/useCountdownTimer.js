// hooks/useCountdownTimer.js
import { useEffect } from 'react';

export function useCountdownTimer(timerRef, isRunningRef = { current: true }, intervalMs = 1000) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunningRef.current && timerRef.current > 0) {
        timerRef.current -= 1;
        // Optional: log to verify it's ticking
        // console.log("⏱ Timer:", timerRef.current);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, []); // ✅ Empty dependency array to avoid restarting the interval
}
