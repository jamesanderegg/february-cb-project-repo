// import React, { useState, useEffect } from 'react';

// const RecordingStatusMonitor = ({ COLAB_API_URL }) => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [frameCount, setFrameCount] = useState(0);
//   const [episodeLength, setEpisodeLength] = useState(0);
//   const [error, setError] = useState(null);
  
//   // Update recording status when window.isRecordingActive changes
//   useEffect(() => {
//     const handleRecordingStatusChange = (event) => {
//       if (event && event.detail && typeof event.detail.isRecording === 'boolean') {
//         setIsRecording(event.detail.isRecording);
//       }
//     };
    
//     // Set initial state
//     setIsRecording(window.isRecordingActive === true);
    
//     // Listen for status changes
//     window.addEventListener('recordingStatusChanged', handleRecordingStatusChange);
    
//     // Start a polling interval to update frame count
//     const interval = setInterval(() => {
//       if (window.isRecordingActive) {
//         // Make sure the URL is correctly formed
//         const url = new URL('/recording_status', COLAB_API_URL).toString();
//         console.log('Fetching recording status from:', url);
        
//         // Fetch current recording status from backend
//         fetch(url, {
//           method: 'GET',
//           headers: {
//             'Accept': 'application/json',
//             'ngrok-skip-browser-warning': 'true'
//           }
//         })
//           .then(response => {
//             if (!response.ok) {
//               throw new Error(`HTTP error! Status: ${response.status}`);
//             }
//             return response.json();
//           })
//           .then(data => {
//             if (data.is_recording) {
//               setFrameCount(data.frame_count || 0);
//               setEpisodeLength(data.episode_length || 0);
//             }
//             setError(null);
//           })
//           .catch(error => {
//             console.error("Error fetching recording status:", error);
//             setError(`${error.message}`);
//           });
//       }
//     }, 1000);
    
//     return () => {
//       window.removeEventListener('recordingStatusChanged', handleRecordingStatusChange);
//       clearInterval(interval);
//     };
//   }, [COLAB_API_URL]);
  
//   // Don't render if not recording and no error
//   if (!isRecording && !error) {
//     return null;
//   }
  
//   // Simple floating display
//   return (
//     <div style={{
//       position: 'fixed',
//       bottom: '10px',
//       right: '10px',
//       backgroundColor: 'rgba(0, 0, 0, 0.7)',
//       color: 'white',
//       padding: '8px 12px',
//       borderRadius: '4px',
//       fontFamily: 'monospace',
//       fontSize: '12px',
//       zIndex: 9999
//     }}>
//       {isRecording ? (
//         <>
//           <div>🔴 RECORDING</div>
//           <div>Frames: {frameCount}</div>
//           <div>Episode steps: {episodeLength}</div>
//         </>
//       ) : null}
      
//       {error ? (
//         <div style={{ color: 'red' }}>
//           ⚠️ Error: {error}
//         </div>
//       ) : null}
//     </div>
//   );
// };

// export default RecordingStatusMonitor;

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