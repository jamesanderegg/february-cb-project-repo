import React, { useState, useEffect } from 'react';

/**
 * ReplaySpeedControlUI - A component to adjust replay playback speed
 */
const ReplaySpeedControlUI = ({ COLAB_API_URL, isReplaying = false }) => {
  const [speed, setSpeed] = useState(1.0);
  const [status, setStatus] = useState('');

  // Update speed when slider changes
  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
  };

  // Send speed to backend when Apply button is clicked
  const applySpeed = () => {
    setStatus('Applying...');
    
    fetch(`${COLAB_API_URL}/set_replay_speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`🎮 Set replay speed: ${data.message}`);
      setStatus(`Speed set to ${speed.toFixed(1)}x`);
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    })
    .catch(error => {
      console.error('Error setting replay speed:', error);
      setStatus('Error setting speed');
      
      // Clear error after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    });
  };

  // Set some common speed presets
  const setSpeedPreset = (presetSpeed) => {
    setSpeed(presetSpeed);
    // Automatically apply the preset
    fetch(`${COLAB_API_URL}/set_replay_speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed: presetSpeed })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`🎮 Set replay speed: ${data.message}`);
      setStatus(`Speed set to ${presetSpeed.toFixed(1)}x`);
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    })
    .catch(error => {
      console.error('Error setting replay speed:', error);
      setStatus('Error setting speed');
    });
  };

  // Apply default speed when component mounts
  useEffect(() => {
    // Set default speed when component first loads
    fetch(`${COLAB_API_URL}/set_replay_speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed: 1.0 })
    })
    .then(response => response.json())
    .then(data => {
      console.log(`🎮 Set initial replay speed: ${data.message}`);
    })
    .catch(error => {
      console.error('Error setting initial replay speed:', error);
    });
  }, [COLAB_API_URL]);

  return (
    <div className="replay-speed-control" style={{
      padding: '10px',
      backgroundColor: '#2d3748',
      borderRadius: '5px',
      marginTop: '10px',
      color: 'white',
      opacity: isReplaying ? 1 : 0.6
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>
        Replay Speed Control
        {status && <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#63b3ed' }}>{status}</span>}
      </h4>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
          style={{ flex: 1, marginRight: '10px' }}
        />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>{speed.toFixed(1)}x</span>
        <button 
          onClick={applySpeed}
          style={{
            marginLeft: '10px',
            padding: '4px 8px',
            backgroundColor: '#4299e1',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Apply
        </button>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => setSpeedPreset(0.5)}
          style={{
            padding: '4px 8px',
            backgroundColor: speed === 0.5 ? '#38a169' : '#4a5568',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          0.5x
        </button>
        <button 
          onClick={() => setSpeedPreset(1.0)}
          style={{
            padding: '4px 8px',
            backgroundColor: speed === 1.0 ? '#38a169' : '#4a5568',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          1.0x
        </button>
        <button 
          onClick={() => setSpeedPreset(2.0)}
          style={{
            padding: '4px 8px',
            backgroundColor: speed === 2.0 ? '#38a169' : '#4a5568',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          2.0x
        </button>
        <button 
          onClick={() => setSpeedPreset(5.0)}
          style={{
            padding: '4px 8px',
            backgroundColor: speed === 5.0 ? '#38a169' : '#4a5568',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          5.0x
        </button>
      </div>
    </div>
  );
};

export default ReplaySpeedControlUI;