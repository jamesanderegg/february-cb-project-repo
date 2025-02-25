import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLights from "./lights/DirectionalLight";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';
import MiniMapHUD from "./camera/MiniMapHUD";
import TopDownCamera from "./camera/TopDownCamera";

const Main = ({ robotCameraRef, miniMapCameraRef, robotPositionRef, robotRotationRef }) => {
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Main Camera */}
        <PrimaryCamera position={[7, 1, 30]} />

        {/* Mini-Map Top-Down Camera */}
        <TopDownCamera ref={miniMapCameraRef} robotPositionRef={robotPositionRef} />

        {/* Controls */}
        <OrbitControls />

        {/* Lights */}
        <AmbientLight />
        <DirectionalLights />

        {/* Main Scene */}
        <MainScene 
          robotCameraRef={robotCameraRef} 
          robotPositionRef={robotPositionRef} 
          robotRotationRef={robotRotationRef} 
        />

        {/* Environment */}
        <Environment preset="city" />
      </Canvas>

      {/* HUD Views */}
      <HUDView robotCameraRef={robotCameraRef} />
      <MiniMapHUD miniMapCameraRef={miniMapCameraRef} />
    </>
  );
};

export default Main;
