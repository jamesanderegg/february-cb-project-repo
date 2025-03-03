import React, { useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { movableModels } from './MoveableModels';
import Model from '../../helper/Model';

const ObjectRandomizer = forwardRef(({ tableConfigs, setObjectPositions }, ref) => {
  // For tracking reset iterations
  const resetCounterRef = useRef(0);
  // For tracking physics objects
  const objectRefsRef = useRef([]);
  
  // Expose the reset function to parent components
  useImperativeHandle(ref, () => ({
    resetEnvironment: () => {
      // Clean up physics bodies if needed
      objectRefsRef.current.forEach(objRef => {
        if (objRef.current?.api) {
          // Remove from physics world
          objRef.current.api.removeFromWorld();
        }
      });
      
      // Reset refs array
      objectRefsRef.current = [];
      
      // Increment counter to force re-randomization
      resetCounterRef.current += 1;
      // Force re-render with new value
      forceUpdate();
    }
  }));
  
  // Simple hook to force update
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Generate random object positions
  const objectPositions = useMemo(() => {
    if (!tableConfigs.length) return [];
    console.log("Generating new object positions, reset counter:", resetCounterRef.current);

    const availableTables = [...tableConfigs];
    const availableModels = [...movableModels];
    const positions = [];

    const modelCount = Math.min(availableModels.length, availableTables.length);

    for (let i = 0; i < modelCount; i++) {
      const randomTableIndex = Math.floor(Math.random() * availableTables.length);
      const selectedTable = availableTables.splice(randomTableIndex, 1)[0];

      const randomModelIndex = Math.floor(Math.random() * availableModels.length);
      const selectedModel = availableModels.splice(randomModelIndex, 1)[0];

      const modelHeight = selectedModel.height || 0.5;
      
      // Add some randomization within the table bounds
      const tableWidth = selectedTable.size?.[0] || 2;
      const tableDepth = selectedTable.size?.[2] || 2;
      
      const offsetX = (Math.random() - 0.5) * (tableWidth * 0.7);
      const offsetZ = (Math.random() - 0.5) * (tableDepth * 0.7);
      
      const position = [
        selectedTable.position[0] + offsetX,
        selectedTable.position[1] + 1.5 + modelHeight,
        selectedTable.position[2] + offsetZ
      ];

      // Random rotation for more variety
      const randomRotation = [0, Math.random() * Math.PI * 2, 0];

      positions.push({
        ...selectedModel,
        id: `${selectedModel.name}-${i}-${resetCounterRef.current}`, // Add unique ID with reset counter
        tableIndex: tableConfigs.indexOf(selectedTable),
        position,
        rotation: selectedModel.rotation || randomRotation
      });
    }
    return positions;
  }, [tableConfigs, resetCounterRef.current]); // Depends on tableConfigs and reset counter

  // Update parent component with new positions
  useEffect(() => {
    setObjectPositions((prevPositions) => {
      // Only update if changed
      const isSame = JSON.stringify(prevPositions) === JSON.stringify(objectPositions);
      return isSame ? prevPositions : objectPositions;
    });
  }, [objectPositions, setObjectPositions]);

  return (
    <>
      {objectPositions.map((obj, index) => {
        // Create a new ref for each object
        const objRef = React.useRef();
        
        // Store ref for cleanup
        if (!objectRefsRef.current[index]) {
          objectRefsRef.current[index] = objRef;
        }
        
        return (
          <Model
            key={obj.id || `${obj.name}-${index}-${resetCounterRef.current}`}
            ref={objRef}
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
        );
      })}
    </>
  );
});

export default ObjectRandomizer;
