import React from "react";
import { Physics } from "@react-three/rapier";
import Model from "../helper/Model";
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnv/ScaledEnv";  // Scale Objects: Plane, OuterWalls, Trellis, Floors, Rooms 
import Buggy from "./Buggy";
import Tables from "./StaticSceneElements/TheManyTables/Tables.jsx";
import { tableConfigs } from './StaticSceneElements/TheManyTables/tableConfig.js';
import ObjectRandomizer from './ModelFunctions/ObjectRandomizer.jsx';

const MainScene = ({ robotCameraRef, onCapture }) => {

  return (
    <Physics gravity={[0, -9.81, 0]}>

      {/* Object Models */}
      <ObjectRandomizer tableConfigs={tableConfigs} />

      {/* Scale Objects: Plane, OuterWalls, Trellis, Floors, Rooms */}
      <ScaledEnvUniform scale={2} /> {/* Adjust scale value as needed */}
     
      <Tables tableConfigs={tableConfigs} />
      <ObjectRandomizer tableConfigs={tableConfigs} />

      <Buggy
        position={[7, 0.1, 15]}
        scale={0.025}
        rotation={[0, -Math.PI / 2, 0]}
        metallic={0.8}
        roughness={0.3}
        robotCameraRef={robotCameraRef}
        />

    </Physics>
  );
};

export default MainScene;
