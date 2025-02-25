import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import SpotLights from "./lights/Spotlights";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';
import MiniMapHUD from "./camera/MiniMapHUD";
import TopDownCamera from "./camera/TopDownCamera";

const Main = ({ robotCameraRef, miniMapCameraRef, robotPositionRef, robotRotationRef, YOLOdetectObject }) => {
  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);
  const detectionDisplayRef = useRef(null);
  const robotMemoryRef = useRef([]); // ✅ Stores last 3-5 high-confidence detections

  // ✅ Update the HUD continuously without re-renders
  useEffect(() => {
    const updateHUD = () => {
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

      // ✅ Process YOLO detections without re-rendering
      if (detectionDisplayRef.current && YOLOdetectObject.current) {
        const detections = YOLOdetectObject.current.detections || [];
        const highConfidenceDetections = detections.filter(d => d.confidence >= 0.75); // ✅ 75% confidence threshold

        if (highConfidenceDetections.length > 0) {
          // ✅ Merge with existing memory: Keep only highest confidence per item
          const memoryMap = new Map(robotMemoryRef.current.map(item => [item.class_name, item])); 

          highConfidenceDetections.forEach(detection => {
            if (
              !memoryMap.has(detection.class_name) || 
              detection.confidence > memoryMap.get(detection.class_name).confidence
            ) {
              memoryMap.set(detection.class_name, detection); // Keep highest confidence
            }
          });

          // ✅ Store only last 5 unique detections
          robotMemoryRef.current = Array.from(memoryMap.values()).slice(-5);
        }

        // ✅ Display detections in the HUD
        detectionDisplayRef.current.innerText =
          robotMemoryRef.current.length > 0
            ? robotMemoryRef.current.map((item) => 
                `${item.class_name} (${(item.confidence * 100).toFixed(1)}%)`).join(", ")
            : "No high-confidence detections.";
      }

      requestAnimationFrame(updateHUD);
    };

    requestAnimationFrame(updateHUD);
  }, []);

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
            <p ref={detectionDisplayRef}>Detected Objects: Waiting...</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;
