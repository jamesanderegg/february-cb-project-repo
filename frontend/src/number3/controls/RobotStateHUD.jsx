// src/components/RobotStatePanel.jsx (or wherever fits your structure)
import React from 'react';
import { useEffect, useState } from 'react';
import '../../styles/AgentDashboard.css';



const RobotStatePanel = ({ liveStateRef, controlMode, targetObject }) => {
     const [, forceUpdate] = useState(0);
      useEffect(() => {
        const interval = setInterval(() => forceUpdate(p => p + 1), 500);
        return () => clearInterval(interval);
      }, []);
  return (
    <div className="robot-state-container">
      <div className="robot-state-inline">
        <h3 style={{ margin: '4px 0'}}> Robot State</h3>
        <p><strong>Collision:</strong> {liveStateRef.current?.collision ? 'Yes' : 'No'}</p>
        <p><strong>Pos:</strong> {liveStateRef.current?.robot_pos?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
        <p><strong>Rot:</strong> {liveStateRef.current?.robot_rot?.map(n => n.toFixed(2)).join(', ') || '---'}</p>
        <p><strong>Detected:</strong> {liveStateRef.current?.detectedObjects?.join(', ') || 'None'}</p>
        <p><strong>In View:</strong> {liveStateRef.current?.objectsInView?.join(', ') || 'None'}</p>
        <p><strong>Time Left:</strong> {liveStateRef.current?.time_left ?? '---'}s</p>
        <p><strong>Mode:</strong> {controlMode}</p>
        <p><strong>Target:</strong> {targetObject || '---'}</p>
        <p><strong>Actions:</strong> {liveStateRef.current?.currentActions?.join(', ') || 'None'}</p>
        <p><strong>Frame:</strong> #{liveStateRef.current?.frame_number ?? '---'}</p>
      </div>
    </div>
  );
};

export default RobotStatePanel;
