import React from "react";
import { Canvas, useThree } from "@react-three/fiber";

import OrbitControls from "./controls/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";

import Model from "../helper/Model";


import PrimaryCamera from "./camera/PrimaryCamera";
import PiPCamera from "./camera/PiPCamera"; // Importing PiP Camera

import Scene from "./objects/Scene";
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
    >
      <PrimaryCamera position={[30, 80, 100]} lookAt={[0, 0, 0]} />

      {/* Lights */}
      <AmbientLight />
      <DirectionalLight
        color="white"
        intensity={10}
        position={[7, 3, 5]}
        targetPosition={[0, 0, 0]}
        castShadow
        shadowProps={{
          near: 1,
          far: 50,
          mapSize: [2048, 2048],
        }}
      />
<Model
        filePath="robot.glb"
        scale={.02}
        position={[5, 0, 15]}
        
      />
      <Model
        filePath="apple.glb"
        scale={0.05}
        position={[-1.5, 0, -1]}
        color="red"
      />

      <Scene />
      <OrbitControls enableDamping />
    </Canvas>
  );
}
