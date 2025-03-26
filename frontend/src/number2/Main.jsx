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

import { io } from "socket.io-client";

const Main = ({ 
  robotCameraRef, 
  miniMapCameraRef, 
  robotPositionRef, 
  robotRotationRef, 
  YOLOdetectObject, 
  collisionIndicator = useRef(false), // Provide a default ref if not passed
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
  const timerRef = useRef(350); 
  const timerIntervalRef = useRef(null);

  const currentActionRef = useRef([]);
  const currentActionDisplayRef = useRef(null);

  const [showDashboard, setShowDashboard] = useState(false);
  const [objectPositions, setObjectPositions] = useState([]);
  const objectPositionsRef = useRef([]);
  const closestObjectDisplayRef = useRef(null);

  const objectsInViewRef = useRef([]);
  const objectsInViewDisplayRef = useRef(null);

  // YOLO processing refs
  const isProcessingRef = useRef(false);
  const imageCountRef = useRef(0);

  const targetRef = useRef(target);  
  const buggyRef = useRef();
  const recordingControlsRef = useRef(null);
  
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
    robotRef: buggyRef,
    robotCameraRef,
    robotPositionRef,
    robotRotationRef,
    collisionIndicator,
    targetObject: YOLOdetectObject,
    setObjectPositions,
    COLAB_API_URL
  });
  
  // YOLO image processing function (moved from RobotCamera.jsx)
  async function captureAndSendImage(imageBlob) {
    if (!imageBlob) {
      console.warn("No image available for YOLO processing.");
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    imageCountRef.current += 1;

    const reader = new FileReader();
    reader.readAsDataURL(imageBlob);
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        // Send only the image to the endpoint
        const response = await fetch(`${COLAB_API_URL}/receive_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Image
          }),
        });

        const data = await response.json();
        console.log("✅ YOLO Detection Results:", data);
        YOLOdetectObject.current = data.detections; // Update with latest detections
      } catch (error) {
        console.error("❌ Error sending image:", error);
      }

      isProcessingRef.current = false;
    };
  }
  
  // Add the updateObjects functionality from MainScene.jsx
  useEffect(() => {
    if (objectPositions && Array.isArray(objectPositions) && objectPositions.length > 0) {
      fetch(`${COLAB_API_URL}/update_objects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectPositions }),
      })
        .then(response => response.json())
        .then(data => {
          console.log("✅ Object positions sent:", data);

          // Update the target with the value from the response data
          if (data.target) {
            console.log(data.target);
            setTarget(data.target);  // Update the target state
          }
        })
        .catch(error => console.error("❌ Error sending object positions:", error));
    } else {
      console.warn("⚠️ objectPositions is not an array or is empty:", objectPositions);
    }
  }, [objectPositions, COLAB_API_URL, setTarget]);
  
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

  useEffect(() => {
    if (!objectPositions || objectPositions.length === 0) {
      console.log("⏳ Waiting for objects to be set before starting WebSocket...");
      return; // Do nothing until objectPositions is set
    }
  
    const socket = io(`${COLAB_API_URL.replace("http", "ws")}`, {
      transports: ["websocket"],
    });
  
    socket.on("connect", () => {
      console.log("✅ WebSocket connected");
    });
  
    socket.on("action", (action) => {
      console.log("📩 Received action:", action);
      applyAction(action); // Apply action to robot
    });
  
    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });
  
    // Function to send the robot's state
    const sendState = () => {
      if (socket.connected) {
        const state = {
          robot_pos: robotPositionRef.current || [0, 0, 0],
          robot_rot: robotRotationRef.current || [0, 0, 0, 1],
          detectedObjects: YOLOdetectObject?.current || [],
          objectsInViewRef: objectsInViewRef.current || [],
          collision: collisionIndicator?.current || false,
          currentActionRef: currentActionRef.current || [],
          time_left: timerRef.current || 350,
          target_object: targetRef.current || null,
        };
        socket.emit("state", state);  // Send state to Colab
      }
    };
  
    // Send state as fast as DQN can process it
    const interval = setInterval(sendState, 100); // Adjust as needed
  
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [COLAB_API_URL, objectPositions]); // Dependency added for objectPositions
  
  // Function to apply action to robot
  const applyAction = (action) => {
    console.log("🔄 Applying action:", action);
    // Logic to update the robot's movement/state
  };
  
  const resetScene = () => {
    console.log("🔄 Resetting scene from Main component...");
    if (recordingControlsRef.current && 
        recordingControlsRef.current.isRecording && 
        recordingControlsRef.current.isRecording()) {
      console.log("Recording in progress - stopping recording before reset");
      recordingControlsRef.current.stopRecording();
    }
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

      timerRef.current = 350;
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
      }, 350);
    }, 2000);
  };

  useEffect(() => {
    // Update target ref when target prop changes
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
    
      // Update collision and target displays
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
    
      // Calculate and display closest object
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
        // Update the current action display
        if (currentActionDisplayRef.current) {
          currentActionDisplayRef.current.innerText = 
            `Current Actions: ${currentActionRef.current.length > 0 
              ? currentActionRef.current.join(", ") 
              : "None"}`;
        }
      }
      // Request the next frame
      requestAnimationFrame(updateHUD);
    };
    
    requestAnimationFrame(updateHUD);
  }, [target]);

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
      if (e.key === 'v' || e.key === 'V') {
        console.log("📸 'v' key pressed in Main component");
        setObjectPositions([]);
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
          timerRef={timerRef} 
          resetScene={resetScene}
          currentActionRef={currentActionRef}
          onCaptureImage={captureAndSendImage} // Pass the YOLO processing function to MainScene
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
            <p ref={timerDisplayRef}>Time Remaining: 350s</p>
            {/* Display the target using targetRef */}
            <p id="target-display" ref={robotStateDisplayRef}></p>
            <p id="target-display" ref={targetDisplayRef}></p>
            <p id="closest-object-display" ref={closestObjectDisplayRef}>Closest Object: Loading...</p>
            <p ref={currentActionDisplayRef}>Current Actions: None</p>
         
          </div>
        </div>
        <div className="replay-controls-container">
          <ReplayControlsModal 
            setObjectPositions={setObjectPositions} 
            onReset={resetScene} // Pass the resetScene function to the ReplayControls component
            COLAB_API_URL={COLAB_API_URL}
            onRecordingRef={(controls) => recordingControlsRef.current = controls}
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
                  COLAB_API_URL={COLAB_API_URL}
                />
              )}
            </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Main);