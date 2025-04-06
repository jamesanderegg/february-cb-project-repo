import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

const TimerHUDUpdater = ({ timerRef, timerDisplayRef, resetScene }) => {
  const lastTimerValue = useRef(timerRef.current);

  useFrame((state, delta) => {
    if (timerRef.current > 0) {
      timerRef.current -= delta;

      // Avoid spamming updates — update only when the second value changes
      const currentSecond = Math.ceil(timerRef.current);
      if (currentSecond !== lastTimerValue.current) {
        lastTimerValue.current = currentSecond;

        if (timerDisplayRef.current) {
          timerDisplayRef.current.innerText = `Time Remaining: ${currentSecond}s`;
        }
      }
    } else {
      if (timerDisplayRef.current) {
        timerDisplayRef.current.innerText = `Time Remaining: 0s`;
      }
      resetScene?.(); // optional auto-reset when timer hits 0
    }
  });

  return null; // No visual output
};

export default TimerHUDUpdater;
