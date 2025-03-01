import React, { useRef, useEffect, useState } from "react";
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

const Main = ({ robotCameraRef, miniMapCameraRef, robotPositionRef, robotRotationRef, YOLOdetectObject, collisionIndicator }) => {
  // Set up refs for position, rotation, detection, and state display
  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);
  const detectionDisplayRef = useRef(null);
  const robotStateDisplayRef = useRef(null);

  const robotMemoryRef = useRef([]);

  const [objectPositions, setObjectPositions] = useState(null);
  // post request that sends the robot state to flask.

  // console.log("Main re-rendering", {
  //   robotCameraRef,
  //   miniMapCameraRef,
  //   robotPositionRef,
  //   robotRotationRef,
  //   YOLOdetectObject,
  //   collisionIndicator,
  // });

  useEffect(() => {
    if (objectPositions) {
      console.log("🚀 Grandparent - Updated Object Positions:", objectPositions);

      fetch("http://localhost:5001/object-positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectPositions }),
      })
        .then(response => response.json())
        .then(data => console.log("✅ Server Response:", data))
        .catch(error => console.error("Error posting object positions:", error));
    }
  }, [objectPositions]);


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

      // ✅ Update collision state display
      if (robotStateDisplayRef.current) {
        robotStateDisplayRef.current.innerText = `Collision: ${collisionIndicator?.current ? "True" : "False"}`;
      }

      // ✅ Process YOLO detections without re-rendering
      if (detectionDisplayRef.current && YOLOdetectObject?.current) {
        const detections = YOLOdetectObject.current.detections || [];
        const highConfidenceDetections = detections.filter(d => d.confidence >= 0.75); // ✅ 75% confidence threshold

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
        <SpotLights />
        <MainScene
          robotCameraRef={robotCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={YOLOdetectObject}
          collisionIndicator={collisionIndicator}
          objectPositions={objectPositions}
          setObjectPositions={setObjectPositions}
        />
        <Environment preset="apartment" />
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
      </div>
    </>
  );
};


export default React.memo(Main);
