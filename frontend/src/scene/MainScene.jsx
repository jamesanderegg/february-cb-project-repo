import React from "react";
import { Canvas } from "@react-three/fiber";
import Cube from "./objects/Cube";
import Plane from "./objects/Plane";
import OrbitControls from "./controls/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";

const MainScene = () => (
  <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
    {/* Lights */}
    <AmbientLight />
    <DirectionalLight
      color="yellow"
      intensity={1.5}
      position={[7, 3, 5]}
      targetPosition={[0, 0, 0]}
      castShadow
      shadowProps={{
        near: 1,
        far: 50,
        mapSize: [2048, 2048]
      }}
    />

    {/* Objects */}
    <Cube size={[2, 2, 2]} color="red" position={[-2, 1, 0]} />
    <Cube
      size={[1, 1, 1]}
      color="green"
      position={[2, 1, 0]}
      rotation={[0, Math.PI / 4, 0]}
      rotationSpeed={[0, 0.05, 0]} // Faster spinning speed
    />
    <Cube size={[1.5, 1.5, 1.5]} color="blue" position={[0, 1, -2]} />

    {/* Ground Plane */}
    <Plane />

    {/* Controls */}
    <OrbitControls />
  </Canvas>
);

export default MainScene;
