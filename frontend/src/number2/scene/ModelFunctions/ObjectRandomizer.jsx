import React, { useMemo, useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { movableModels } from './MoveableModels';
import Model from '../../helper/Model';

const ObjectRandomizer = forwardRef(({ tableConfigs, setObjectPositions }, ref) => {
  const [resetCounter, setResetCounter] = useState(0);
  const objectRefs = useRef(new Map()); // Store refs for object persistence

  // Expose reset function for parent components
  useImperativeHandle(ref, () => ({
    resetEnvironment: () => {
      console.log("🔄 Resetting object positions...");
      setResetCounter((prev) => prev + 1);
    }
  }));

  // Memoize object positions to minimize recalculations
  const objectPositions = useMemo(() => {
    if (!tableConfigs.length) return [];

    console.log(`🔄 Generating new positions | Reset Count: ${resetCounter}`);

    let availableTables = [...tableConfigs];
    let availableModels = [...movableModels];
    let positions = [];

    const modelCount = Math.min(availableModels.length, availableTables.length);

    for (let i = 0; i < modelCount; i++) {
      const tableIndex = Math.floor(Math.random() * availableTables.length);
      const selectedTable = availableTables.splice(tableIndex, 1)[0];

      const modelIndex = Math.floor(Math.random() * availableModels.length);
      const selectedModel = availableModels.splice(modelIndex, 1)[0];

      // Get table dimensions
      const tableHeight = selectedTable.size?.[1] || 1; // Get table height or default to 1
      const tableWidth = selectedTable.size?.[0] || 2;
      const tableDepth = selectedTable.size?.[2] || 2;
      
      // Calculate the top surface of the table
      // If table position is at center, we add half height to get to top
      const tableTopY = selectedTable.position[1] + (tableHeight / 2);
      
      // Randomized position within table bounds
      const offsetX = (Math.random() - 0.5) * (tableWidth * 0.7);
      const offsetZ = (Math.random() - 0.5) * (tableDepth * 0.7);
      
      // Place object slightly above table surface for physics to work properly
      // Add enough height (0.2) to ensure it's definitely above the table
      const position = [
        selectedTable.position[0] + offsetX,
        tableTopY + 2, // Slightly higher to ensure no initial collision
        selectedTable.position[2] + offsetZ
      ];

      const rotation = selectedModel.rotation || [0, Math.random() * Math.PI * 2, 0];

      positions.push({
        ...selectedModel,
        id: `${selectedModel.name}`, // Add ID
        position,
        rotation,
        // Ensure proper physics props for falling
        physicsProps: {
          mass: selectedModel.mass || 1, // Ensure mass is set
          type: 'dynamic', // Explicitly set as dynamic
          linearDamping: selectedModel.linearDamping || 0.5,
          angularDamping: selectedModel.angularDamping || 0.5,
          friction: selectedModel.friction || 0.7, // Add friction for better physics
          restitution: selectedModel.restitution || 0, // Add bounciness
        }
      });
    }
    return positions;
  }, [tableConfigs, resetCounter]); // Recalculate only on reset

  // Batch update the state only if positions change
  useEffect(() => {
    setObjectPositions((prevPositions) => {
      if (JSON.stringify(prevPositions) === JSON.stringify(objectPositions)) return prevPositions;
      console.log("📦 Updated object positions:", objectPositions);
      return objectPositions;
    });
  }, [objectPositions, setObjectPositions]);

  return (
    <>
      {objectPositions.map((obj) => {
        if (!objectRefs.current.has(obj.id)) {
          objectRefs.current.set(obj.id, React.createRef());
        }
        return (
          <Model
            key={obj.id}
            ref={objectRefs.current.get(obj.id)}
            filePath={obj.filePath}
            scale={obj.scale}
            position={obj.position}
            rotation={obj.rotation}
            color={obj.color}
            metallic={obj.metallic || 1}
            roughness={obj.roughness || 0.2}
            castShadow={obj.castShadow ?? true}
            receiveShadow={obj.receiveShadow ?? true}
            physicsProps={{
              mass: obj.physicsProps?.mass || 1,
              type: 'dynamic', // Explicitly set as dynamic
              linearDamping: obj.physicsProps?.linearDamping || 0.5,
              angularDamping: obj.physicsProps?.angularDamping || 0.5,
              friction: obj.physicsProps?.friction || 0.7,
              restitution: obj.physicsProps?.restitution || 0,
            }}
            collider={obj.collider || 'cuboid'}
          />
        );
      })}
    </>
  );
});

export default ObjectRandomizer;