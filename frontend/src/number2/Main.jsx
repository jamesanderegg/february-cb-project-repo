import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import AmbientLight from "./lights/AmbientLight";
import DirectionalLights from "./lights/DirectionalLight";
import SpotLights from "./lights/Spotlights";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';
import MiniMapHUD from "./camera/MiniMapHUD";
import TopDownCamera from "./camera/TopDownCamera";

const Main = ({ robotCameraRef, miniMapCameraRef, robotPositionRef, robotRotationRef, YOLOdetectObject }) => {
  // Set up refs for position and rotation display inside the component
  const positionDisplayRef = React.useRef(null);
  const rotationDisplayRef = React.useRef(null);
  
  // Update the position and rotation displays
  React.useEffect(() => {
    const updatePositionRotation = () => {
      if (positionDisplayRef.current && rotationDisplayRef.current) {
        const pos = Array.isArray(robotPositionRef.current) && robotPositionRef.current.length === 3
          ? robotPositionRef.current
          : [0, 0, 0]; // Fallback

        const rot = Array.isArray(robotRotationRef.current) && robotRotationRef.current.length === 4
          ? robotRotationRef.current
          : [0, 0, 0, 1]; // Fallback

        positionDisplayRef.current.innerText = `Position: ${pos
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;

        rotationDisplayRef.current.innerText = `Rotation (Quaternion): ${rot
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;
      }
      requestAnimationFrame(updatePositionRotation);
    };
    
    requestAnimationFrame(updatePositionRotation);
    
    return () => cancelAnimationFrame(updatePositionRotation);
  }, [robotPositionRef, robotRotationRef]);

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
        {/* <AmbientLight /> */}
        {/* <DirectionalLights /> */}
        <SpotLights />

        {/* Main Scene */}
        <MainScene 
          robotCameraRef={robotCameraRef} 
          robotPositionRef={robotPositionRef} 
          robotRotationRef={robotRotationRef} 
          YOLOdetectObject={YOLOdetectObject}
        />

        {/* Environment */}
        <Environment preset="apartment" />
      </Canvas>

      {/* HUD Views Container */}
      <div className="hud-container">
        {/* Mini-Map HUD (Far Left) */}
        <div className="mini-map-container">
          <MiniMapHUD miniMapCameraRef={miniMapCameraRef} />
        </div>
        
        {/* Robot Camera HUD (Middle) */}
        <div className="robot-camera-container">
          <HUDView robotCameraRef={robotCameraRef} />
        </div>
        
        {/* Robot State (After Camera) */}
        <div className="robot-state-container">
          <div className="robot-state-inline">
            <h3>Robot State</h3>
            <p ref={positionDisplayRef}>Position: Loading...</p>
            <p ref={rotationDisplayRef}>Rotation (Quaternion): Loading...</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;