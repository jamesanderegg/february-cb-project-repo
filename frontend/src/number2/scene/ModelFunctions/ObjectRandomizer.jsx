import React, { useState, useEffect } from 'react';
import { movableModels } from './MoveableModels';
import Model from '../../helper/Model'; // Ensure this path is correct

const ObjectRandomizer = ({ tableConfigs }) => {
  const [objectPositions, setObjectPositions] = useState([]);

  // Function to assign initial random positions
  const assignInitialPositions = () => {
    const availableTables = [...tableConfigs];
    return movableModels.map((model) => {
      if (availableTables.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * availableTables.length);
      const table = availableTables.splice(randomIndex, 1)[0];

      return {
        ...model,
        tableIndex: tableConfigs.indexOf(table),
        position: [
          table.position[0],
          table.position[1] + 1.5 + model.height,
          table.position[2]
        ]
      };
    }).filter(Boolean);
  };

  useEffect(() => {
    setObjectPositions(assignInitialPositions());
  }, []);

  return (
    <>
      {objectPositions.map((obj, index) => (
        <Model
          key={index}
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
