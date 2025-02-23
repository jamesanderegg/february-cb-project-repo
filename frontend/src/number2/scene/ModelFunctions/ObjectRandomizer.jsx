import React, { useState, useEffect, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { movableModels } from './Models';
import { useGLTF } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';

const Model = ({ filePath, scale, position, rotation = [0, 0, 0], color }) => {
  const { scene } = useGLTF(filePath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((node) => {
      if (node.isMesh) {
        node.material = new MeshStandardMaterial({ color });
      }
    });
  }, [clonedScene, color]);

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
};

const ObjectRandomizer = ({ tableConfigs }) => {
    const [objectPositions, setObjectPositions] = useState([]);
  
    // Function to assign initial random positions
    const assignInitialPositions = () => {
      const availableTables = [...tableConfigs];
      return movableModels.map((model, index) => {
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

  // Function to move one random object
  const moveRandomObject = () => {
    const currentTime = Date.now();
    if (currentTime - lastMoveTime < 60000) return; // 60 seconds interval check

    setObjectPositions(prevPositions => {
      // Get occupied table indices
      const occupiedTables = new Set(prevPositions.map(obj => obj.tableIndex));
      
      // Find available tables
      const availableTables = tableConfigs
        .map((_, index) => index)
        .filter(index => !occupiedTables.has(index));

      if (availableTables.length === 0) return prevPositions;

      // Select random object to move
      const objectIndex = Math.floor(Math.random() * prevPositions.length);
      
      // Select random available table
      const newTableIndex = availableTables[Math.floor(Math.random() * availableTables.length)];
      const newTable = tableConfigs[newTableIndex];

      // Create new positions array with updated position for selected object
      return prevPositions.map((obj, index) => {
        if (index === objectIndex) {
          return {
            ...obj,
            tableIndex: newTableIndex,
            position: [
              newTable.position[0],
              newTable.position[1] + 1.5 + obj.height,
              newTable.position[2]
            ]
          };
        }
        return obj;
      });
    });

    setLastMoveTime(currentTime);
  };

  useEffect(() => {
    // Set initial positions
    const initialPositions = assignInitialPositions();
    setObjectPositions(initialPositions);

    // Add event listener for object movement
    const handleMoveObject = () => moveRandomObject();
    window.addEventListener('moveObject', handleMoveObject);

    // Cleanup event listener on unmount
    return () => window.removeEventListener('moveObject', handleMoveObject);
  }, []);

  return (
    <>
      {objectPositions.map((obj, index) => (
        <RigidBody
          key={index}
          position={obj.position}
          colliders="hull"
        >
          <Model
            filePath={obj.filePath}
            scale={obj.scale}
            position={[0, 0, 0]} // Position is handled by RigidBody
            rotation={obj.rotation || [0, 0, 0]}
            color={obj.color}
          />
        </RigidBody>
      ))}
    </>
  );
};

export default ObjectRandomizer;