import { useState } from 'react';

const Table = ({ color, position }) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.25, 0.75, 0.25]} />
        <meshBasicMaterial color={color} side={2} />
      </mesh>
      
      {/* Stand */}
      <mesh position={[0, 0.625, 0]}>
        <cylinderGeometry args={[0, 0.15, 1]} />
        <meshBasicMaterial color={color} side={2} />
      </mesh>
      
      {/* Top */}
      <mesh position={[0, 1.125, 0]}>
        <boxGeometry args={[1.4, 0.025, 1.4]} />
        <meshBasicMaterial color={color} side={2} />
      </mesh>
    </group>
  );
};

const Tables = () => {
  const tableConfigs = [
    // Blue room tables (3)
    { color: '#aa875c', position: [-1.5, 0, 0] },
    { color: '#ad6d68', position: [1.5, 0, 1.5] },
    { color: '#4a0100', position: [0, 0, -1.5] },
    
    // Red room tables (3)
    { color: '#c2a293', position: [-1.5, 0, 12] },
    { color: '#aa875c', position: [0.5, 0, 13.5] },
    { color: '#4a0100', position: [0, 0, 10.5] },
    
    // Yellow room tables (3)
    { color: '#4a0100', position: [16.5, 0, 13.5] },
    { color: '#ad6d68', position: [16.5, 0, 12] },
    { color: '#cc5801', position: [15, 0, 10.5] },
    
    // Orange room tables (3)
    { color: '#4a0100', position: [8.5, 0, 3.5] },
    { color: '#4a0100', position: [11.5, 0, 3.5] },
    { color: '#4a0100', position: [11.5, 0, 0.25] },
    
    // Green room tables (3)
    { color: '#8a3244', position: [3.5, 0, -9] },
    { color: '#aa875c', position: [5.5, 0, -10.25] },
    { color: '#4a0100', position: [3.5, 0, -11.75] }
  ];

  return (
    <>
      {tableConfigs.map((config, index) => (
        <Table 
          key={index} 
          color={config.color} 
          position={config.position}
        />
      ))}
    </>
  );
};

export default Tables;