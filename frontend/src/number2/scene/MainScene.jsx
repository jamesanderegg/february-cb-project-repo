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
      {/* <Model
        filePath="/models/glasses-6.glb"
        scale={1}
        position={[0, 0, 0]}
        color={"black"}
        castShadow
      /> */}

      <Model 
        filePath="/models/alarmClock.glb"
        scale={0.1}
        position={[0, 0, 25]}
        color="blue"
      />

      <Model
        filePath="/models/bike.glb"
        scale={.04}
        color="black"
        position={[-2, 10, 0]}
        metallic={0}
        roughness={1}
        castShadow
      />

      <Model
        filePath="/models/trees.glb"
        position={[-17, 0, 1]}
        rotation={ [0, Math.PI /2, 0]}
        scale = {3}
        color="olive"
      />  

      <Model
        filePath="/models/backpack.glb"
        position={[-10, 0, 0]}
        scale={.1}
        color="aliceblue"
      />  

      <Model
        filePath="/models/handbag.glb"
        position={[5, 0, 0]}
        scale={3}
        color="red"
      />

      <Model
        filePath="/models/teddy.glb"
        position={[3, 0, 0]}
        scale={1}
        color="brown"
      />

      <Model
        filePath="/models/phone.glb"
        position={[1, 0, 0]}
        scale={3}
        color="black"
      />

      <Model
        filePath="/models/pottedPlant.glb"
        position={[0, 0, 13]}
        scale={0.05}
        color="blue"
      />

      <Model
        filePath={"models/moreTrees.glb"}
        position={[35, 30, -1]}
        scale = {.3}
        color="olive"
      />

      <Model
        filePath={"models/umbrella.glb"}
        position={[0, 5, 10]}
        scale = {.015}
        color = "red"
      />

      <Model
        filePath="/models/book.glb"
        scale={.4}
        position={[1, 0, 0]}
        color='orange'
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
