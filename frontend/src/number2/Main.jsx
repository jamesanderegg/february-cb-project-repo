import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLight from "./lights/DirectionalLight";
import Spotlight from "./lights/Spotlight";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';

const MOVEMENT_INTERVAL = 60000; // 60 seconds

const Main = ({ robotCameraRef, onCapture }) => {
  useEffect(() => {
    // Create a custom event for object movement
    const moveObjectEvent = new CustomEvent('moveObject');

    // Set up interval to dispatch the event
    const intervalId = setInterval(() => {
      window.dispatchEvent(moveObjectEvent);
    }, MOVEMENT_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Camera */}
        <PrimaryCamera position={[7, 1, 30]} />

        {/* Controls */}
        <OrbitControls />

        {/* Lights */}
        <AmbientLight />
        <DirectionalLight />
        {/* <Spotlight /> */}

        {/* Main Scene */}
        <MainScene robotCameraRef={robotCameraRef} />

        {/* Environment */}
        <Environment preset="city" />
      </Canvas>
      <HUDView robotCameraRef={robotCameraRef} />
    </>
  );
};

export default Main;