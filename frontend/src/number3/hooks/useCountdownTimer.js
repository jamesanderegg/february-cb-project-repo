import { useEffect } from 'react';

export function useCountdownTimer(timerRef, isRunningRef = { current: true }, intervalMs = 1000, defaultTime = 350) {
  
  // SOLUTION 4: Listen for timerReset event
  useEffect(() => {
    const handleTimerReset = (event) => {
      const resetValue = event.detail?.resetValue || defaultTime;
      console.log("📨 Timer: Received timerReset event, setting to", resetValue);
      timerRef.current = resetValue;
    };

    window.addEventListener('timerReset', handleTimerReset);
    
    return () => {
      window.removeEventListener('timerReset', handleTimerReset);
    };
  }, [timerRef, defaultTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunningRef.current) return;

      if (timerRef.current > 0) {
        timerRef.current -= 1;
      }

      if (timerRef.current === 0) {
        console.log("⏰ Timer: Expired — triggering scene reset and restarting timer");
        window.dispatchEvent(new CustomEvent("sceneReset"));
        timerRef.current = defaultTime; // 🔁 Restart timer
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [timerRef, isRunningRef, intervalMs, defaultTime]);
}