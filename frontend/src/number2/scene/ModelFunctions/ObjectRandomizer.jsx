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

  useEffect(() => {
    const initialPositions = assignInitialPositions();
    setObjectPositions(initialPositions);
  }, []);

  return (
    <>
      {objectPositions.map((obj, index) => (
        <RigidBody
          key={index}
          position={obj.position}
          colliders="cuboid"
          type="fixed"
          collisionGroups={0x00000002}
          sensor
        >
          <Model
            filePath={obj.filePath}
            scale={obj.scale}
            position={[0, 0, 0]}
            rotation={obj.rotation || [0, 0, 0]}
            color={obj.color}
          />
        </RigidBody>
      ))}
    </>
  );
};

export default ObjectRandomizer;