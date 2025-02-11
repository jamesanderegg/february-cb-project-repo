import React from "react";
import { Canvas, useThree } from "@react-three/fiber";

import Plane from "./objects/Plane";
import OrbitControls from "./controls/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";

import Model from "../helper/Model";
import PrimaryCamera from "./camera/PrimaryCamera";


import Scene from "./objects/Scene"
import FiberTable from "./objects/FiberTable"

import RobotWithCamera from "./objects/RobotWithCamera";

export default function App() {

  // Table configurations - each entry contains color and position
const tableConfigs = [
  // Blue room tables (3)
  { color: '#aa875c', position: [-1.5, 0, 0] },
  { color: '#ad6d68', position: [1.5, 0, 1.5] },
  { color: '#4a0100', position: [0, 0, -1.5] },
  
  // Red room tables (3)
  { color: '#c2a293', position: [-1.5, 0, 12] },
  { color: '#aa875c', position: [0.5, 0, 13.5] },
  { color: '#4a0100', position: [0, 0, 10.5] },
  
  // Yellow room tables (3)
  { color: '#4a0100', position: [16.5, 0, 13.5] }, // not this one--orange
  { color: '#ad6d68', position: [16.5, 0, 12] },
  { color: '#cc5801', position: [15, 0, 10.5] },
  
  // Orange room tables (3)
  { color: '#4a0100', position: [8.5, 0, 3.5] },
  { color: '#4a0100', position: [11.5, 0, 3.5] },
  { color: '#4a0100', position: [11.5, 0, 0.25] },
  
  // Green room tables (3)
  { color: '#8a3244', position: [3.5, 0, -9] },
  { color: '#aa875c', position: [5.5, 0, -10.25] },
  { color: '#4a0100', position: [3.5, 0, -11.75] } // dark brown
];

  return (
    <Canvas
      camera={{
        fov: 20,
        position: [0, 0, 100],
        near: 0.1,
        far: 400,
      }}
      className="w-screen h-screen"
      shadows
    >
      <PrimaryCamera position={[30, 90, 20]} lookAt={[0, 0, 0]} />

      {/* Lights */}
      <AmbientLight />
      <DirectionalLight
        color="white"
        intensity={5}
        position={[5, 10, 5]}
        targetPosition={[5, 0, 13]}
        castShadow={true}
        shadowProps={{ near: 0.1, far: 1000, mapSize: [1024, 1024] }}
      />
      <RobotWithCamera position={[5, 0, 15]} />

      <Model
        filePath="apple.glb"
        scale={0.005}
        position={[-1.5, 1.26, -.5]}
        color="red"
        castShadow 
      />

      {tableConfigs.map((config, index) => (
        <FiberTable 
          key={index}
          color={config.color}
          position={config.position}
        />
      ))}

      <FiberTable position={[6, 0, 8]} color="yellow" />
      <FiberTable position={[10, 0, 6]} color="darkred" />
      <FiberTable position={[0, 0, 6]} color="blue" />
      <Scene />
      <OrbitControls enableDamping />
    </Canvas>
  );
}