import React from "react";
import { Canvas } from "@react-three/fiber";
import Cube from "./objects/Cube";
import Plane from "./objects/Plane";
import OrbitControls from "./controls/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";
import Building from "./Building/Building";
import Model from "../helper/Model";
import PrimaryCamera from "./camera/PrimaryCamera";
import PiPCamera from "./camera/PiPCamera"; // Importing PiP Camera

const MainScene = () => {
  return (
    <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
      {/* Primary Camera */}
      <PrimaryCamera position={[10, 10, 10]} lookAt={[0, 2, 0]} />

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
          mapSize: [2048, 2048],
        }}
      />

      {/* Objects */}
      <Model filePath="apple.glb" scale={0.05} position={[-1.5, 0, -1]} color="red" />
      <Building />
      <Plane />

      {/* Controls */}
      <OrbitControls />

      {/* Picture-in-Picture Camera */}
      <PiPCamera position={[0, 5, -10]} lookAt={[0, 0, 0]} />
    </Canvas>
  );
};

export default MainScene;
