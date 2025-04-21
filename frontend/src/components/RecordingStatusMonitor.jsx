import React, { useState, useEffect } from 'react';

const RecordingStatusMonitor = () => {
  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    const handleRecordingStatusChange = (event) => {
      if (event && event.detail && typeof event.detail.isRecording === 'boolean') {
        setIsRecording(event.detail.isRecording);
      }
    };
    
    // Set initial state
    setIsRecording(window.isRecordingActive === true);
    
    // Listen for status changes
    window.addEventListener('recordingStatusChanged', handleRecordingStatusChange);
    
    return () => {
      window.removeEventListener('recordingStatusChanged', handleRecordingStatusChange);
    };
  }, []);
  
  if (!isRecording) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>🔴 RECORDING</div>
    </div>
  );
};

export default RecordingStatusMonitor;