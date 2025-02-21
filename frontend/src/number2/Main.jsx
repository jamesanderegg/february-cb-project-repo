import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";
import Spotlight from "./lights/Spotlight";
import MainScene from "./scene/MainScene"; // Importing the MainScene

const Main = ({ robotCameraRef, onCapture }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 50 }}
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Camera */}
      <PrimaryCamera position ={ [7,1,30]} />

      {/* Controls */}
      <OrbitControls />

      {/* Lights */}
      <AmbientLight />
      <DirectionalLight />
      {/* <Spotlight /> */}
      
      {/* Main Scene */}
      <MainScene robotCameraRef={robotCameraRef} onCapture={onCapture} />

      {/* Environment */}
      {/* <Environment preset="sunset" /> */}
    </Canvas>
  );
};

export default Main;