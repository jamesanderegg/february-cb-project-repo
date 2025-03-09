import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import io from 'socket.io-client';

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./contols/OrbitControls";
import SpotLights from "./lights/Spotlights";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';
import MiniMapHUD from "./camera/MiniMapHUD";
import TopDownCamera from "./camera/TopDownCamera";
import ReplayControlsModal from '../components/ReplayControls';
import AmbientLight from "./lights/AmbientLight";

const Main = ({ 
  robotCameraRef, 
  miniMapCameraRef, 
  robotPositionRef, 
  robotRotationRef, 
  YOLOdetectObject, 
  collisionIndicator, 
  isRunning, 
  setIsRunning 
}) => {
 
  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);
  const detectionDisplayRef = useRef(null);
  const robotStateDisplayRef = useRef(null);
  const robotMemoryRef = useRef([]);

  const [objectPositions, setObjectPositions] = useState([]);

  useEffect(() => {
    const updateHUD = () => {
      if (positionDisplayRef.current && rotationDisplayRef.current) {
        const pos = Array.isArray(robotPositionRef.current) && robotPositionRef.current.length === 3
          ? robotPositionRef.current
          : [0, 0, 0];

        const rot = Array.isArray(robotRotationRef.current) && robotRotationRef.current.length === 4
          ? robotRotationRef.current
          : [0, 0, 0, 1];

        positionDisplayRef.current.innerText = `Position: ${pos
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;

        rotationDisplayRef.current.innerText = `Rotation (Quaternion): ${rot
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;
      }

      if (robotStateDisplayRef.current) {
        robotStateDisplayRef.current.innerText = `Collision: ${collisionIndicator?.current ? "True" : "False"}`;
      }

      if (detectionDisplayRef.current && YOLOdetectObject?.current) {
        const detections = YOLOdetectObject.current || [];
        const highConfidenceDetections = detections.filter(d => d.confidence >= 0.5);

        if (highConfidenceDetections.length > 0) {
          const memoryMap = new Map(robotMemoryRef.current.map(item => [item.class_name, item]));

          highConfidenceDetections.forEach(detection => {
            if (!memoryMap.has(detection.class_name) || detection.confidence > memoryMap.get(detection.class_name).confidence) {
              memoryMap.set(detection.class_name, detection);
            }
          });

          robotMemoryRef.current = Array.from(memoryMap.values()).slice(-5);
        }

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
  useEffect(() => {
    if (collisionIndicator?.current) {
      console.log("🚨 Collision detected! Resetting scene...");
      setIsRunning(false); // Stop the scene

      setTimeout(() => {
        console.log("🔄 Resetting robot and objects...");

        // Reset robot position & rotation
        if (robotPositionRef.current) robotPositionRef.current = [7, 0.1, 15];
        if (robotRotationRef.current) robotRotationRef.current = [0, -Math.PI / 2, 0, 1];

        // Reset objects using the ObjectRandomizer function
        if (window.resetEnvironment) {
          window.resetEnvironment();
        } else {
          console.warn("❗ Reset function not available.");
        }

        // Restart scene after a brief pause
        setTimeout(() => {
          setIsRunning(true);
          console.log("▶️ Scene restarted.");
        }, 500);
      }, 2000);
    }
  }, [collisionIndicator?.current]); // Runs whenever collisionIndicator changes

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [7, 1, 30], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <PrimaryCamera position={[7, 1, 30]} />
        <TopDownCamera ref={miniMapCameraRef} robotPositionRef={robotPositionRef} />
        <OrbitControls />
        <AmbientLight />
        <SpotLights />
        <MainScene
          robotCameraRef={robotCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={YOLOdetectObject}
          collisionIndicator={collisionIndicator}
          objectPositions={objectPositions}
          setObjectPositions={setObjectPositions}
          isRunning={isRunning} 
        />
        <Environment preset="apartment" intensity={20} />
      </Canvas>

      {/* HUD Views Container */}
      <div className="hud-container">
        <div className="mini-map-container">
          <MiniMapHUD miniMapCameraRef={miniMapCameraRef} />
        </div>

        <div className="robot-camera-container">
          <HUDView robotCameraRef={robotCameraRef} />
        </div>

        <div className="robot-state-container">
          <div className="robot-state-inline">
            <h3 ref={robotStateDisplayRef}>Robot State: Loading...</h3>
            <p ref={positionDisplayRef}>Position: Loading...</p>
            <p ref={rotationDisplayRef}>Rotation (Quaternion): Loading...</p>
            <p ref={detectionDisplayRef}>Detected Objects: Waiting...</p>
          </div>
        </div>
        <div className="replay-controls-container">
          <ReplayControlsModal setObjectPositions={setObjectPositions} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Main);
