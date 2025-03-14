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

      const modelHeight = selectedModel.height || 0.5;
      const tableWidth = selectedTable.size?.[0] || 2;
      const tableDepth = selectedTable.size?.[2] || 2;

      // Randomized position within table bounds
      const offsetX = (Math.random() - 0.5) * (tableWidth * 0.7);
      const offsetZ = (Math.random() - 0.5) * (tableDepth * 0.7);
      
      const position = [
        selectedTable.position[0] + offsetX,
        selectedTable.position[1] + 1.5 + modelHeight,
        selectedTable.position[2] + offsetZ
      ];

      const rotation = selectedModel.rotation || [0, Math.random() * Math.PI * 2, 0];

      positions.push({
        ...selectedModel,
        id: `${selectedModel.name}-${i}-${resetCounter}`,
        position,
        rotation
      });
    }
    return positions;
  }, [tableConfigs, resetCounter]); // Recalculate only on reset

  // Batch update the state only if positions change
  useEffect(() => {
    setObjectPositions((prevPositions) => {
      if (JSON.stringify(prevPositions) === JSON.stringify(objectPositions)) return prevPositions;
      console.log(objectPositions)
      return objectPositions;
    });
  }, [objectPositions, setObjectPositions]);

  return (
    <>
      {objectPositions.map((obj, index) => {
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
              mass: obj.mass || 1,
              linearDamping: obj.linearDamping || 0.5,
              angularDamping: obj.angularDamping || 0.5,
            }}
          />
        );
      })}
    </>
  );
});

export default ObjectRandomizer;
