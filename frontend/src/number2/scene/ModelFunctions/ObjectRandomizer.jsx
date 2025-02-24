import React, { useState, useEffect } from 'react';
import { movableModels } from './MoveableModels';
import Model from '../../helper/Model';

const ObjectRandomizer = ({ tableConfigs }) => {
  const [objectPositions, setObjectPositions] = useState([]);

  // Function to assign random positions with constraints
  const assignRandomPositions = () => {
    // Create a copy of tables and models to work with
    const availableTables = [...tableConfigs];
    const availableModels = [...movableModels];
    const positions = [];
    
    // Ensure we don't try to place more models than tables
    const modelCount = Math.min(availableModels.length, availableTables.length);
    
    // For each model we want to place
    for (let i = 0; i < modelCount; i++) {
      // Pick a random table from remaining tables
      const randomTableIndex = Math.floor(Math.random() * availableTables.length);
      const selectedTable = availableTables.splice(randomTableIndex, 1)[0];
      
      // Pick a random model from remaining models
      const randomModelIndex = Math.floor(Math.random() * availableModels.length);
      const selectedModel = availableModels.splice(randomModelIndex, 1)[0];
      
      // Calculate position on top of the table
      const modelHeight = selectedModel.height || 0.5; // Default height if not specified
      const position = [
        selectedTable.position[0],
        selectedTable.position[1] + 1.5 + modelHeight, // Table height + model height
        selectedTable.position[2]
      ];
      
      // Store the position data
      positions.push({
        ...selectedModel,
        tableIndex: tableConfigs.indexOf(selectedTable),
        position: position
      });
    }
    
    return positions;
  };

  useEffect(() => {
    // Only assign positions once when component mounts
    setObjectPositions(assignRandomPositions());
  }, [tableConfigs]); // Re-run if tableConfigs changes

  return (
    <>
      {objectPositions.map((obj, index) => (
        <Model
          key={`${obj.name}-${index}`} // Better key for React
          filePath={obj.filePath}
          scale={obj.scale}
          position={obj.position}
          rotation={obj.rotation || [0, 0, 0]}
          color={obj.color}
          metallic={obj.metallic || 1}
          roughness={obj.roughness || 0.2}
          castShadow={obj.castShadow ?? true}
          receiveShadow={obj.receiveShadow ?? true}
          physicsProps={{
            mass: obj.mass || 1,
            linearDamping: obj.linearDamping || 0.5,
            angularDamping: obj.angularDamping || 0.5,
          }}
        />
      ))}
    </>
  );
};

export default ObjectRandomizer;
