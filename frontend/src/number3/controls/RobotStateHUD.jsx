import React, { useEffect, useState } from 'react';
import '../../styles/AgentDashboard.css';

const RobotStatePanel = ({ liveStateRef, controlMode, targetObject }) => {
  const [, forceUpdate] = useState(0);
  const [lastDetected, setLastDetected] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(p => p + 1);

      const currentDetected = liveStateRef.current?.detectedObjects;
      if (Array.isArray(currentDetected) && currentDetected.length > 0) {
        setLastDetected(currentDetected[0]); // or join(', ') if you prefer
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="robot-state-container">
      <div className="robot-state-inline">
        <h3 style={{ margin: '4px 0' }}>Robot State</h3>
        {/* <p><strong>Collision:</strong> {liveStateRef.current?.collision ? 'Yes' : 'No'}</p> */}
        <p><strong>Pos:</strong> {liveStateRef.current?.robot_pos?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
        <p><strong>Rot:</strong> {liveStateRef.current?.robot_rot?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
        <p><strong>Last Detected:</strong> {lastDetected || 'None'}</p>
        <p><strong>In View:</strong> {
          Array.isArray(liveStateRef.current?.objectsInView)
            ? liveStateRef.current.objectsInView.map(obj => obj.id || "unknown").join(', ')
            : 'None'
        }</p>

        <p><strong>Time Left:</strong> {liveStateRef.current?.time_left ?? '---'}s</p>
        <p><strong>Mode:</strong> {controlMode}</p>
        <p><strong>Target:</strong> {targetObject || '---'}</p>
        <p><strong>Replay Target Object:</strong> {liveStateRef.current.targetObject || 'None'}</p>
        <p><strong>Actions:</strong> {liveStateRef.current?.currentActions?.join(', ') || 'None'}</p>
        <p><strong>Frame:</strong> #{liveStateRef.current?.frame_number ?? '---'}</p>
      </div>
    </div>
  );
};

export default RobotStatePanel;
