import React from "react";
import { Physics } from "@react-three/rapier";
import Model from "../helper/Model";
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnv/ScaledEnv";
import Buggy from "./Buggy";
import Tables from "./StaticSceneElements/TheManyTables/Tables.jsx";
import { tableConfigs } from './StaticSceneElements/TheManyTables/tableConfig.js';
import ObjectRandomizer from './ModelFunctions/ObjectRandomizer.jsx';

const MainScene = ({ robotCameraRef, robotPositionRef, robotRotationRef, YOLOdetectObject, triggerIndicator }) => {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* Scale Objects: Plane, OuterWalls, Trellis, Floors, Rooms */}
      <ScaledEnvUniform scale={2} /> {/* Adjust scale value as needed */}
     
      {/* Tables */}
      <Tables tableConfigs={tableConfigs} />
      
      {/* Randomized Objects - only include this once */}
      <ObjectRandomizer tableConfigs={tableConfigs} />

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
        triggerIndicator={triggerIndicator}
      />
    </Physics>
  );
};

export default MainScene;