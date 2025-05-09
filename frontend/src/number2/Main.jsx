import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Scene Components
import PrimaryCamera from "./camera/PrimaryCamera";
import OrbitControls from "./controls/OrbitControls";
import SpotLights from "./lights/Spotlights";
import MainScene from "./scene/MainScene";
import HUDView from './camera/HUDView';
import MiniMapHUD from "./camera/MiniMapHUD";
import TopDownCamera from "./camera/TopDownCamera";
// import ReplayControlsModal from '../components/ReplayControls';
import AmbientLight from "./lights/AmbientLight";
import GameLoop from "./scene/GameLoop"; // Import our new GameLoop component
import RecordingStatusMonitor from '../components/RecordingStatusMonitor';
import { useAgentController } from "./scene/AgentController";
import AgentDashboard from "./scene/AgentDashboard";
import { useActionHandler } from './ActionHandler';

import ReplayController from './scene/Replays/ReplayController';
import CombinedReplayController from './scene/Replays/CombinedReplayController';

import TimerHUDUpdater from "../components/TimerHUDUpdater";

import { io } from "socket.io-client";
import { model } from "@tensorflow/tfjs";

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
  const modelPositionsRef = useRef({});
  const recordingControlsRef = useRef(null);

  // State to track if we're waiting for replay save
  const [autoStoppedReplay, setAutoStoppedReplay] = useState(false);
  const [physicsResetKey, setPhysicsResetKey] = useState(0);

  const currentActionRef = useRef([]);
  const currentActionDisplayRef = useRef(null);

  const [showDashboard, setShowDashboard] = useState(false);
  const [objectPositions, setObjectPositions] = useState([]);
  const [replayPositions, setReplayPositions] = useState(null);
  
  const objectPositionsRef = useRef([]);
  const closestObjectDisplayRef = useRef(null);

  const objectsInViewRef = useRef([]);
  const objectsInViewDisplayRef = useRef(null);

  // YOLO processing refs
  const isProcessingRef = useRef(false);
  const imageCountRef = useRef(0);
  // const keysPressed = useRef({});  // Store keysPressed at Main level
  // const lastVActionTime = useRef(0); // Store lastVActionTime at Main level

  const {
    keysPressed,
    keyDurations,
    lastVActionTime,
    currentActions: actionHandlerRef
  } = useActionHandler({
    currentActionRef: currentActionRef,
    isRunning,
    onActionChange: (actions) => {
      // Optional callback when actions change
      // console.log("Actions changed:", actions);
    }
  });

  const targetRef = useRef(target);  
  const buggyRef = useRef();
  
  // Socket.io connection
  const socketRef = useRef(null);
  
  // Use the agent controller
  const {
    connectToAgent,
    startTraining,
    stopTraining,
    startInference,
    fetchReplays,
    agentStatus,
    isConnected,
    lastAction,
    metrics,
    replays,
    isLoading,
    trainingProgress,
    errorMessage,
    successMessage,
    clearMessages
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

  // Handler for recording state changes
  const handleRecordingStateChange = (isRecording) => {
    // Broadcast recording state change
    window.isRecordingActive = isRecording;
    window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
      detail: { isRecording }
    }));
    
    console.log(`🎬 Recording state changed to: ${isRecording}`);
    
    // Reset auto-stopped flag when starting a new recording
    if (isRecording) {
      setAutoStoppedReplay(false);
    }
  };

  // Handler for recording reference
  const handleRecordingRef = (controls) => {
    recordingControlsRef.current = controls;
    
    // Create a watch function to monitor recording status changes
    if (controls && typeof controls.isRecording === 'function') {
      let lastRecordingState = false;
      
      // Check periodically
      const checkInterval = setInterval(() => {
        const currentRecordingState = controls.isRecording();
        if (currentRecordingState !== lastRecordingState) {
          // Recording state changed
          handleRecordingStateChange(currentRecordingState);
          lastRecordingState = currentRecordingState;
        }
      }, 500); // Check every 500ms
      
      // Store the interval ID
      recordingStatusIntervalRef.current = checkInterval;
    }
    
    return controls;
  };
  
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
        // console.log("✅ YOLO Detection Results:", data);
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
 

  // Initialize socket connection
  useEffect(() => {
    if (!objectPositions || objectPositions.length === 0) {
      console.log("⏳ Waiting for objects to be set before starting WebSocket...");
      return; // Do nothing until objectPositions is set
    }
  
    const socket = io(`${COLAB_API_URL.replace("http", "ws")}`, {
      transports: ["websocket"],
    });
    
    socketRef.current = socket;
  
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

    socket.on("replay_action", (replayData) => {
      console.log("📩 Received replay action:", replayData);
      
      // Extract the action from the replay data
      const action = replayData.action;
      
      // Update UI to show replay status
      window.dispatchEvent(new CustomEvent('recordingStatusChanged', {
        detail: { 
          isReplaying: true,
          step: replayData.step,
          totalSteps: replayData.total_steps,
          message: `Replaying step ${replayData.step + 1}/${replayData.total_steps}`
        }
      }));
      
      // Apply the action to the robot
      if (action && Array.isArray(action) && action.length > 0) {
        // 1. Simulate key presses
        // First, reset all keys
        Object.keys(keysPressed.current).forEach(k => {
          keysPressed.current[k] = false;
        });
        
        // Then set the current action key(s)
        action.forEach(key => {
          if (key && keysPressed.current) {
            keysPressed.current[key] = true;
            
            // For "v" key (taking photo), also update lastVActionTime
            if (key === "v" && lastVActionTime) {
              lastVActionTime.current = Date.now();
            }
          }
        });
        
        // Update currentActionRef
        currentActionRef.current = action;
      }
      
      // 2. Extract position and rotation from state
      if (replayData.state && Array.isArray(replayData.state)) {
        const state = replayData.state;
        
        // Based on your state structure: robot_pos (3) + robot_rot (3) + collision (1) + time_left (1) + detected_objects (5)
        // So the first 3 elements are position, and the next 3 are rotation
        if (state.length >= 6) {
          const position = state.slice(0, 3);
          const rotation = state.slice(3, 6);
          
          console.log("Robot position from state:", position);
          
          
          // Update position reference if available
          if (robotPositionRef && robotPositionRef.current) {
            robotPositionRef.current = position;
          }
          
          // Update rotation reference if available - handle the quaternion case
          if (robotRotationRef && robotRotationRef.current) {
            // If robotRotationRef is storing a quaternion (4 values), we need to convert the euler angles
            // For now, we'll just update the first 3 components and keep the w component
            if (robotRotationRef.current.length >= 4) {
              robotRotationRef.current = [...rotation, robotRotationRef.current[3]];
            } else {
              robotRotationRef.current = rotation;
            }
          }
          
          // If we have direct access to the Three.js object, update it
          if (buggyRef && buggyRef.current) {
            // Check if position property exists (Three.js object)
            if (buggyRef.current.position) {
              buggyRef.current.position.set(position[0], position[1], position[2]);
            }
            
            // Check if rotation property exists (Three.js object)
            if (buggyRef.current.rotation) {
              buggyRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
            }
          }
        }
      }
    });
    
    socket.on("replay_complete", (data) => {
      console.log("✅ Replay complete:", data);
      
      // Reset all key presses
      if (keysPressed.current) {
        Object.keys(keysPressed.current).forEach(k => {
          keysPressed.current[k] = false;
        });
      }
      
      // Update UI to show replay is complete
      if (recordingControlsRef.current && recordingControlsRef.current.updateStatus) {
        recordingControlsRef.current.updateStatus({
          message: `Replay complete - ${data.steps_played} steps played`,
          type: 'complete'
        });
      }
    });

    socket.on("robot_position_update", (data) => {
      console.log("📍 Received position update:", data);
      
      // Update robot position and rotation directly
      if (data.position && Array.isArray(data.position) && data.position.length === 3) {
        if (robotPositionRef && robotPositionRef.current) {
          // Set position directly
          robotPositionRef.current = data.position;
        }
        
        // If we have a direct reference to the robot's Three.js object
        if (buggyRef && buggyRef.current && buggyRef.current.position) {
          buggyRef.current.position.set(
            data.position[0],
            data.position[1],
            data.position[2]
          );
        }
      }
      
      // Update rotation if available
      if (data.rotation && Array.isArray(data.rotation)) {
        if (robotRotationRef && robotRotationRef.current) {
          // If rotation ref stores a quaternion (4 values)
          if (robotRotationRef.current.length >= 4) {
            // Preserve the w component
            robotRotationRef.current = [...data.rotation, robotRotationRef.current[3]];
          } else {
            robotRotationRef.current = data.rotation;
          }
        }
        
        // If we have direct access to the robot's Three.js rotation
        if (buggyRef && buggyRef.current && buggyRef.current.rotation) {
          // Convert to Three.js rotation if needed
          buggyRef.current.rotation.set(
            data.rotation[0],
            data.rotation[1],
            data.rotation[2]
          );
        }
      }
    });
  
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [COLAB_API_URL, objectPositions]); // Dependency added for objectPositions

  useEffect(() => {
    // Make the recordingControlsRef available globally so other components can access it
    window.recordingControlsRef = recordingControlsRef;
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    
    // Debug monitor for ALL socket events
    const originalOn = socketRef.current.on.bind(socketRef.current);
    socketRef.current.on = function(event, callback) {
      // Debug wrapper for the callback
      const wrappedCallback = (...args) => {
        console.log(`🔍 Socket event received: ${event}`, args[0] ? (typeof args[0] === 'object' ? {...args[0]} : args[0]) : null);
        return callback(...args);
      };
      return originalOn(event, wrappedCallback);
    };
    
    // Debug monitor for emissions
    const originalEmit = socketRef.current.emit.bind(socketRef.current);
    socketRef.current.emit = function(event, ...args) {
      console.log(`📤 Socket event emitted: ${event}`, args[0] ? (typeof args[0] === 'object' ? {...args[0]} : args[0]) : null);
      return originalEmit(event, ...args);
    };
    
    return () => {
      // Restore original functions if needed
      if (socketRef.current) {
        socketRef.current.on = originalOn;
        socketRef.current.emit = originalEmit;
      }
    };
  }, [socketRef.current]);
  
  // Function to apply action to robot
  const applyAction = (action) => {
    console.log("🔄 Applying action:", action);
    // Logic to update the robot's movement/state
  };

  const resetScene = () => {
    console.log("🔄 Resetting scene from Main component...");
    window.dispatchEvent(new Event("sceneReset"));
    
    if (recordingControlsRef.current && 
        recordingControlsRef.current.isRecording && 
        recordingControlsRef.current.isRecording()) {
      console.log("Recording in progress - stopping recording before reset");
      recordingControlsRef.current.stopRecording();
    }
    setIsRunning(false);
  
    // Explicitly reset the timer immediately
    timerRef.current = 350;
    if (timerDisplayRef.current) {
      timerDisplayRef.current.innerText = `Time Remaining: 350s`;
    }
  
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
  
      // No need to reset timer here since we did it above
      // timerRef.current = 350;
  
      if (detectionDisplayRef.current) {
        detectionDisplayRef.current.innerText = "Detected Objects: Waiting...";
      }
  
      robotMemoryRef.current = [];
  
      // Reset object positions
      setObjectPositions([]);
      setPhysicsResetKey(prev => prev + 1);
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
        timerDisplayRef.current.innerText = `Time Remaining: ${timerRef.current.toFixed(0)}s`;
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
  }, []);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

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
        camera={{ position: [30, 25, 35], fov: 50 }}
        style={{ width: "100vw", 
                height: "100vh",
                position: "absolute",
                zIndex: 1}}
      >
        {/* <PrimaryCamera position={[30, 25, 35]} lookAt={[0, 0, 0]} /> */}
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
          replayPositions={replayPositions}
          setReplayPositions={setReplayPositions}
          isRunning={isRunning}
          setTarget={setTarget}
          target={target}
          COLAB_API_URL={COLAB_API_URL}
          objectsInViewRef={objectsInViewRef}
          timerRef={timerRef} 
          resetScene={resetScene}
          currentActionRef={currentActionRef}
          keyDurations={keyDurations}
          onCaptureImage={captureAndSendImage}
          keysPressed={keysPressed} // Pass keysPressed down to Buggy
          lastVActionTime={lastVActionTime} // Pass lastVActionTime down to Buggy
          physicsKey={physicsResetKey}
          modelPositionsRef={modelPositionsRef}
        />
        
        {/* Add our GameLoop component */}
        <GameLoop
          // Timer-related props
          timerRef={timerRef}
          timerIntervalRef={timerIntervalRef}
          resetScene={resetScene}
          
          // Robot-related refs
          robotRef={buggyRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          collisionIndicator={collisionIndicator}
          currentActionRef={currentActionRef}
          
          // Camera-related refs
          robotCameraRef={robotCameraRef}
          
          // YOLO processing props
          YOLOdetectObject={YOLOdetectObject}
          onCaptureImage={captureAndSendImage}
          
          // WebSocket props
          socket={socketRef.current}
          objectsInViewRef={objectsInViewRef}
          targetRef={targetRef}

          // Action handling props
          keysPressed={keysPressed}
          keyDurations={keyDurations}
          lastVActionTime={lastVActionTime}
          
          // Other refs
          isProcessingRef={isProcessingRef}
          COLAB_API_URL={COLAB_API_URL}
        />
        
        <Environment preset="apartment" intensity={100} />

        <TimerHUDUpdater 
          timerRef={timerRef} 
          timerDisplayRef={timerDisplayRef} 
          resetScene={resetScene}
        />

        <CombinedReplayController
          COLAB_API_URL={COLAB_API_URL}
          socketRef={socketRef}
          buggyRef={buggyRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          keysPressed={keysPressed}
          currentActionRef={currentActionRef}
          lastVActionTime={lastVActionTime}
          objectPositions={objectPositions}
          setObjectPositions={setObjectPositions}
          setReplayPositions={setReplayPositions}
          resetScene={resetScene}
        />
        
      </Canvas>

      <div className="hud-container" style={{ position: "relative", zIndex: 2 }}>
        <div className="mini-map-container">
          <MiniMapHUD getMiniMapImage={() => miniMapCameraRef.current?.getHudImage()} />
        </div>

        <div className="robot-camera-container">
          <HUDView getHudImage={() => robotCameraRef.current?.getHudImage()} />
        </div>

        <div className="robot-state-container">
          <div className="robot-state-inline">
            <h3>Robot State:</h3>
            <p ref={robotStateDisplayRef}>Collision: Loading...</p>
            <p ref={positionDisplayRef}>Position: Loading...</p>
            <p ref={rotationDisplayRef}>Rotation (Quaternion): Loading...</p>
            <p ref={detectionDisplayRef}>Detected Objects: Waiting...</p>
            <p ref={objectsInViewDisplayRef}>Objects in View: Loading...</p> 
            <p ref={timerDisplayRef}>Time Remaining: 350s</p>
            <p ref={targetDisplayRef}>Target: Loading...</p>
            <p ref={closestObjectDisplayRef}>Closest Object: Loading...</p>
            <p ref={currentActionDisplayRef}>Current Actions: None</p>
         
          </div>
        </div>
        {/* <div className="replay-controls-container">
          <ReplayControlsModal 
            setObjectPositions={setObjectPositions} 
            onReset={resetScene}
            COLAB_API_URL={COLAB_API_URL}
            onRecordingRef={(controls) => {
              recordingControlsRef.current = controls;
              window.recordingControlsRef = { current: controls };
              return controls;
            }}
          />
        </div> */}

        <ReplayController
          COLAB_API_URL={COLAB_API_URL}
          socketRef={socketRef}
          robotRef={buggyRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          keysPressed={keysPressed}
          currentActionRef={currentActionRef}
          lastVActionTime={lastVActionTime}
          onReplayComplete={() => {
            console.log("✅ Replay playback completed");
            // Any additional cleanup or notifications
          }}
        />

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
                  replays={replays}
                  isLoading={isLoading}
                  trainingProgress={trainingProgress}
                  errorMessage={errorMessage}
                  successMessage={successMessage}
                  onConnect={connectToAgent}
                  onStartTraining={startTraining}
                  onStopTraining={stopTraining}
                  onStartInference={startInference}
                  onFetchReplays={fetchReplays}
                  onClearMessages={clearMessages}
                  COLAB_API_URL={COLAB_API_URL}
                  resetScene={resetScene}
                  setReplayPositions={setReplayPositions}
                />
              )}
            </div>
        </div>
        <RecordingStatusMonitor COLAB_API_URL={COLAB_API_URL} />
      </div>
    </>
  );
};

export default React.memo(Main);