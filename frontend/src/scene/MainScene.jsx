import React from "react";
import { Canvas, useThree } from "@react-three/fiber";

import Plane from "./objects/Plane";
import OrbitControls from "./controls/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";

import Model from "../helper/Model";
import PrimaryCamera from "./camera/PrimaryCamera";
import PiPCamera from "./camera/PiPCamera";

import Scene from "./objects/Scene"
import FiberTable from "./objects/FiberTable"

export default function App() {
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
      <PrimaryCamera position={[30, 80, 100]} lookAt={[0, 0, 0]} />

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

      <Model
        filePath="robot.glb"
        scale={.02}
        position={[5, 0, 15]}
        castShadow 
      />
      <Model
        filePath="apple.glb"
        scale={0.05}
        position={[-1.5, 0, -1]}
        color="red"
        castShadow 
      />
      <FiberTable position={[6, 0, 8]} color="yellow" />
      <FiberTable position={[10, 0, 6]} color="darkred" />
      <FiberTable position={[0, 0, 6]} color="blue" />
      <Scene />
      <OrbitControls enableDamping />
    </Canvas>
  );
}
