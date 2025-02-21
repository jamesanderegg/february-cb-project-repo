import React from "react";
import { Physics } from "@react-three/rapier";
import Model from "../helper/Model";
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnv/ScaledEnv";  // Scale Objects: Plane, OuterWalls, Trellis, Floors, Rooms 
import RobotWithCamera from "../scene/RobotWithCamera"
import Buggy from "./Buggy";
import HudView from "../camera/HudView"; // ✅ Import HUD Component
import FiberTable from "./StaticSceneElements/ScaledEnv/FiberTables";
const MainScene = ({ robotCameraRef, onCapture }) => {

  return (
    <Physics debug gravity={[0, -9.81, 0]}>
      {/* Ground Plane
      <Plane width={50} height={50} color="darkgray" showHelper={true} /> */}

      {/* Load Models */}
      <Model
        filePath="/models/apple.glb"
        scale={0.01}
        position={[-8, 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        color="red"

      />
      <Model
        filePath="/models/bike.glb"
        scale={.05}
        color="black"
        position={[-2, 10, 0]}
        metallic={0}
        roughness={1}
        castShadow
      />
      <Model
        filePath="/models/keys1.glb"
        scale={0.02}
        position={[-5, 4, 0]}
        rotation={[0, -Math.PI / 6, 0]}
        color="gold"

      />

      {/* Scale Objects: Plane, OuterWalls, Trellis, Floors, Rooms */}
      <ScaledEnvUniform scale={2} /> {/* Adjust scale value as needed */}
     
      <FiberTable/>

      <Buggy
        position={[7, 0.1, 15]}
        scale={0.025}
        rotation={[0, -Math.PI / 2, 0]}
        metallic={0.8}
        roughness={0.3}
        robotCameraRef={robotCameraRef}
        onCapture={onCapture} />

    </Physics>
  );
};

export default MainScene;
