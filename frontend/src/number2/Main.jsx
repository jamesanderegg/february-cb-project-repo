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
  setIsRunning,
  target,
  setTarget
}) => {
  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);
  const detectionDisplayRef = useRef(null);
  const robotStateDisplayRef = useRef(null);
  const targetDisplayRef = useRef(null);
  const robotMemoryRef = useRef([]);
  const timerDisplayRef = useRef(null);
  const timerRef = useRef(500); // Countdown timer starting at 500 seconds
  const timerIntervalRef = useRef(null); // Holds the interval so it can be restarted

  
  const [objectPositions, setObjectPositions] = useState([]);
  const objectPositionsRef = useRef([]);
  const closestObjectDisplayRef = useRef(null);

  const targetRef = useRef(target);  // Create a ref for the target

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      if (timerRef.current > 0) {
        timerRef.current -= 1;
      } else {
        clearInterval(timerIntervalRef.current);
        console.log("⏳ Timer reached 0. Resetting scene...");
        resetScene();
      }
    }, 1000);
  };

  const resetScene = () => {
    console.log("🔄 Resetting scene from Main component...");
    setIsRunning(false);

    // Make an API call to the reset endpoint
    fetch("https://a127-35-237-59-67.ngrok-free.app/reset_scene", { 
      method: 'POST' 
    }).catch(error => {
      console.error("❌ Error calling reset_scene API:", error);
    });

    setTimeout(() => {
      console.log("🛠 Resetting robot and objects...");

      if (robotPositionRef.current) robotPositionRef.current = [7, 0.1, 15];
      if (robotRotationRef.current) robotRotationRef.current = [0, -Math.PI / 2, 0, 1];

      if (window.resetEnvironment) {
        window.resetEnvironment();
      }

      timerRef.current = 500;
      startTimer();

      if (detectionDisplayRef.current) {
        detectionDisplayRef.current.innerText = "Detected Objects: Waiting...";
      }

      robotMemoryRef.current = [];

      // Reset object positions
      setObjectPositions([]);

      setTimeout(() => {
        setIsRunning(true);
        console.log("▶️ Scene restarted.");
      }, 500);
    }, 2000);
  };

  useEffect(() => {
    console.log("Target updated:", target);
    targetRef.current = target;  // Update the targetRef value

    const updateHUD = () => {
      // Update robot's position
      if (positionDisplayRef.current && rotationDisplayRef.current) {
        const pos =
          Array.isArray(robotPositionRef.current) && robotPositionRef.current.length === 3
            ? robotPositionRef.current
            : [0, 0, 0];
        const rot =
          Array.isArray(robotRotationRef.current) && robotRotationRef.current.length === 4
            ? robotRotationRef.current
            : [0, 0, 0, 1];
    
        positionDisplayRef.current.innerText = `Position: ${pos
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;
    
        rotationDisplayRef.current.innerText = `Rotation (Quaternion): ${rot
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;
      }
    
      // Update collision and target displays (existing code)
      if (robotStateDisplayRef.current) {
        robotStateDisplayRef.current.innerText = `Collision: ${collisionIndicator?.current ? "True" : "False"}`;
      }
      if (targetDisplayRef.current) {
        targetDisplayRef.current.innerText = `Target: ${targetRef.current || "Loading..."}`;
      }
      if (detectionDisplayRef.current && YOLOdetectObject?.current) {
        const detections = YOLOdetectObject.current || [];
        const highConfidenceDetections = detections.filter((d) => d.confidence >= 0.5);
    
        if (highConfidenceDetections.length > 0) {
          const memoryMap = new Map(robotMemoryRef.current.map((item) => [item.class_name, item]));
          highConfidenceDetections.forEach((detection) => {
            if (
              !memoryMap.has(detection.class_name) ||
              detection.confidence > memoryMap.get(detection.class_name).confidence
            ) {
              memoryMap.set(detection.class_name, detection);
            }
          });
          robotMemoryRef.current = Array.from(memoryMap.values()).slice(-5);
        }
    
        detectionDisplayRef.current.innerText =
          robotMemoryRef.current.length > 0
            ? robotMemoryRef.current
                .map((item) => `${item.class_name} (${(item.confidence * 100).toFixed(1)}%)`)
                .join(", ")
            : "No high-confidence detections.";
      }
      if (timerDisplayRef.current) {
        timerDisplayRef.current.innerText = `Time Remaining: ${timerRef.current}s`;
      }
    
      // *** New Code: Calculate and display closest object ***
      if (closestObjectDisplayRef.current && robotPositionRef.current) {
        const robotPos = robotPositionRef.current;
        let closestObject = null;
        let minDistance = Infinity;
        
        // Loop through the object positions stored in the ref
        objectPositionsRef.current.forEach((object) => {
          // Ensure the object has a 'position' property (e.g., [x, y, z])
          if (object.position && object.position.length === 3) {
            const [objX, objY, objZ] = object.position;
            const [robotX, robotY, robotZ] = robotPos;
            // Calculate Euclidean distance
            const distance = Math.sqrt(
              Math.pow(robotX - objX, 2) +
              Math.pow(robotY - objY, 2) +
              Math.pow(robotZ - objZ, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestObject = object;
            }
          }
        });
    
        if (closestObject) {
          closestObjectDisplayRef.current.innerText = `Closest Object: ${closestObject.name} (${minDistance.toFixed(
            2
          )})`;
        } else {
          closestObjectDisplayRef.current.innerText = "Closest Object: None";
        }
      }
      // Request the next frame
      requestAnimationFrame(updateHUD);
    };
    
    requestAnimationFrame(updateHUD);
  }, [target]);  // Re-run effect when target changes

  useEffect(() => {
    startTimer(); 

    return () => clearInterval(timerIntervalRef.current);
  }, []);

  useEffect(() => {
    if (collisionIndicator?.current) {
      console.log("🚨 Collision detected! Resetting scene...");
      resetScene(); 
    }
  }, [collisionIndicator?.current]);
  
  useEffect(() => {
    objectPositionsRef.current = objectPositions;
  }, [objectPositions]);
  

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
          setTarget={setTarget}
          target={target}
        />
        <Environment preset="apartment" intensity={20} />
      </Canvas>

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
            <p ref={timerDisplayRef}>Time Remaining: 500s</p>
            {/* Display the target using targetRef */}
            <p id="target-display" ref={robotStateDisplayRef}></p>
            <p id="target-display" ref={targetDisplayRef}></p>
            <p id="closest-object-display" ref={closestObjectDisplayRef}>Closest Object: Loading...</p>
          </div>
        </div>
        <div className="replay-controls-container">
          <ReplayControlsModal 
            setObjectPositions={setObjectPositions} 
            onReset={resetScene} // Pass the resetScene function to the ReplayControls component
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(Main);