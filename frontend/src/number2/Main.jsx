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

import { useAgentController } from "./scene/AgentController";
import AgentDashboard from "./scene/AgentDashboard";

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
  setTarget,
  COLAB_API_URL
}) => {
  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);
  const detectionDisplayRef = useRef(null);
  const robotStateDisplayRef = useRef(null);
  const targetDisplayRef = useRef(null);
  const robotMemoryRef = useRef([]);
  const timerDisplayRef = useRef(null);
  const timerRef = useRef(500); 
  const timerIntervalRef = useRef(null);

  const [showDashboard, setShowDashboard] = useState(false);
  const [objectPositions, setObjectPositions] = useState([]);
  const objectPositionsRef = useRef([]);
  const closestObjectDisplayRef = useRef(null);

  const objectsInViewRef = useRef([]);
  const objectsInViewDisplayRef = useRef(null);

  const targetRef = useRef(target);  
  const buggyRef = useRef();
  const {
    connectToAgent,
    startTraining,
    stopTraining,
    startInference,
    agentStatus,
    isConnected,
    lastAction,
    metrics
  } = useAgentController({
    robotRef: buggyRef,  // Pass buggy reference
    robotCameraRef,
    robotPositionRef,
    robotRotationRef,
    collisionIndicator,
    targetObject: YOLOdetectObject,
    setObjectPositions
  });
  
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

    fetch(`${COLAB_API_URL}/reset_scene`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log("✅ Reset successful, updating local state:", data);
      // Update robot position and rotation directly from the response if available
      if (data.data && data.data.robot_position && robotPositionRef.current) {
        robotPositionRef.current = data.data.robot_position;
      } else {
        // Default position if not provided
        if (robotPositionRef.current) robotPositionRef.current = [7, 0.1, 15];
      }
      
      if (data.data && data.data.robot_rotation && robotRotationRef.current) {
        robotRotationRef.current = data.data.robot_rotation;
      } else {
        // Default rotation if not provided
        if (robotRotationRef.current) robotRotationRef.current = [0, -Math.PI / 2, 0, 1];
      }
    })
    .catch(error => {
      console.error("❌ Error calling reset_scene API:", error);
      // Fall back to default reset behavior
      if (robotPositionRef.current) robotPositionRef.current = [7, 0.1, 15];
      if (robotRotationRef.current) robotRotationRef.current = [0, -Math.PI / 2, 0, 1];
    });

    setTimeout(() => {
      console.log("🛠 Resetting robot and objects...");

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
    // console.log("Target updated:", target);
    targetRef.current = target;  

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

        if (objectsInViewDisplayRef.current && objectsInViewRef.current) {
          objectsInViewDisplayRef.current.innerText = 
            `Objects in View: ${objectsInViewRef.current.map(obj => obj.name).join(", ") || "None"}`;
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
  
  // Add the keyboard event listener for 'v' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // We'll handle 'v' key in the Buggy component
      // This is just a backup in case we need to handle it at the Main level
      if (e.key === 'v' || e.key === 'V') {
        console.log("📸 'v' key pressed in Main component");
        setObjects([]);
        // The actual processing happens in Buggy.jsx
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    if (window.resetEnvironment) {
      window.resetEnvironment();
    }
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [7, 1, 30], fov: 50 }}
        style={{ width: "100vw", 
                height: "100vh",
                position: "absolute",
                zIndex: 1}}
      >
        <PrimaryCamera position={[7, 1, 30]} />
        <TopDownCamera ref={miniMapCameraRef} robotPositionRef={robotPositionRef} />
        <OrbitControls />
        <AmbientLight />
        <SpotLights />
        <MainScene
          buggyRef={buggyRef}
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
          COLAB_API_URL={COLAB_API_URL}
          objectsInViewRef={objectsInViewRef}
          timerRef={timerRef} // Make sure this line is present
          resetScene={resetScene}
        />
        <Environment preset="apartment" intensity={20} />
      </Canvas>

      <div className="hud-container" style={{ position: "relative", zIndex: 2 }}>
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
            <p ref={objectsInViewDisplayRef}>Objects in View: Loading...</p> 
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
            COLAB_API_URL={COLAB_API_URL}
          />
        </div>
        <div className="agent-dashboard-container">
          <button 
            onClick={() => setShowDashboard(prev => !prev)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              height: '48px',
              borderRadius: '4px',
              cursor: 'pointer',
              position: 'absolute',
              top: '4px',
              right: '10px',
              zIndex: '100',
            }}
          >
            {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
          </button>
            <div className="agentDashboard">
              {showDashboard && (
                <AgentDashboard
                  agentStatus={agentStatus}
                  isConnected={isConnected}
                  lastAction={lastAction}
                  metrics={metrics}
                  onConnect={connectToAgent}
                  onStartTraining={startTraining}
                  onStopTraining={stopTraining}
                  onStartInference={startInference}
                />
              )}
            </div>
        </div>

      </div>
    </>
  );
};

export default React.memo(Main);