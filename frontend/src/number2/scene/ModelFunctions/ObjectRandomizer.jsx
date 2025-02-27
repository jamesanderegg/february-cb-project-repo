import React, { useMemo, useEffect } from 'react';
import { movableModels } from './MoveableModels';
import Model from '../../helper/Model';

const ObjectRandomizer = ({ tableConfigs, setObjectPositions }) => {
  // ✅ Memoize object positions to prevent unnecessary recalculations
  const objectPositions = useMemo(() => {
    if (!tableConfigs.length) return [];

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
      const position = [
        selectedTable.position[0],
        selectedTable.position[1] + 1.5 + modelHeight,
        selectedTable.position[2]
      ];

      positions.push({
        ...selectedModel,
        tableIndex: tableConfigs.indexOf(selectedTable),
        position: position
      });
    }
    return positions;
  }, [tableConfigs]); // Runs only when `tableConfigs` changes

  // ✅ Only update `objectPositions` if it actually changes
  useEffect(() => {
    setObjectPositions((prevPositions) => {
      const isSame = JSON.stringify(prevPositions) === JSON.stringify(objectPositions);
      return isSame ? prevPositions : objectPositions;
    });
  }, [objectPositions, setObjectPositions]); 

  return (
    <>
      {objectPositions.map((obj, index) => (
        <Model
          key={`${obj.name}-${index}`}
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
