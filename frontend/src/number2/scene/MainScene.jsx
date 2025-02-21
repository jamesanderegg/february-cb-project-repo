import React from "react";
import { Physics } from "@react-three/rapier";
import Plane from "./Plane";
import Model from "../helper/Model";
import Floors from "./Floors";
import Room from "./Room";
import OuterWalls from "./OuterWalls";
import Trellis from "./Trellis";
import roomConfigs from "./roomConfigs";
import RobotWithCamera from "../scene/RobotWithCamera"
import Buggy from "./Buggy";

const MainScene = ( { robotCameraRef }) => {
  
  return (
    <Physics debug gravity={[0, -9.81, 0]}>
      {/* Ground Plane */}
      <Plane width={50} height={50} color="darkgray" showHelper={true} />

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
          scale={.05 }
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

      <OuterWalls />
      <Trellis />
      <Floors />
      {/* <RobotWithCamera position={[5, 1, 15]} robotCameraRef={robotCameraRef} /> */}
      <Room config={roomConfigs[0]}/>
      {roomConfigs.map((config) => (
          <Room key={config.name} config={config} castShadow receiveShadow />
        ))}

      <Buggy 
          position={[7,0.1,15]} 
          scale={.025} 
          rotation={[0, Math.PI / 2, 0]} 
          metallic={0.8} 
          roughness={0.3}
        />
      
    </Physics>
  );
};

export default MainScene;
