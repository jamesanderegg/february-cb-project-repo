import React, { useRef } from "react";
import { Physics } from "@react-three/rapier";
import Model from "../helper/Model";
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnv/ScaledEnv";
import Buggy from "./Buggy";
import Tables from "./StaticSceneElements/TheManyTables/Tables.jsx";
import { tableConfigs } from './StaticSceneElements/TheManyTables/tableConfig.js';
import ObjectRandomizer from './ModelFunctions/ObjectRandomizer.jsx';
import ReplayControls from '../../components/ReplayControls.jsx';

const MainScene = ({ 
  robotCameraRef, 
  robotPositionRef, 
  robotRotationRef, 
  YOLOdetectObject, 
  collisionIndicator, 
  objectPositions, 
  setObjectPositions, 
  socket
}) => {
  // Add a ref for the ObjectRandomizer
  const randomizerRef = useRef(null);
  
  // Expose the reset function for parent components or DQN
  React.useEffect(() => {
    // This makes the reset function available globally
    window.resetEnvironment = () => {
      if (randomizerRef.current) {
        console.log("Resetting environment...");
        randomizerRef.current.resetEnvironment();
      }
    };
    
    return () => {
      delete window.resetEnvironment;
    };
  }, []);
  
  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        <ScaledEnvUniform scale={2} />
        <Tables tableConfigs={tableConfigs} />
        
        {/* Pass the ref to ObjectRandomizer */}
        <ObjectRandomizer
          ref={randomizerRef}
          tableConfigs={tableConfigs}
          setObjectPositions={setObjectPositions}
        />
        
        <Buggy 
          position={[7, 0.1, 15]}
          scale={0.025}
          rotation={[0, -Math.PI / 2, 0]}
          metallic={0.8}
          roughness={0.3}
          robotCameraRef={robotCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={YOLOdetectObject}
          collisionIndicator={collisionIndicator}
        />
      </Physics>
      
      {/* {socket && <ReplayControls socket={socket} />} */}
    </>
  );
};

export default MainScene;