import { useEffect } from 'react';

export function useSceneReset(onResetCallback) {
  useEffect(() => {
    const handleReset = () => {
      onResetCallback();
    };

    window.addEventListener('sceneReset', handleReset);

    return () => {
      window.removeEventListener('sceneReset', handleReset);
    };
  }, [onResetCallback]);
}
