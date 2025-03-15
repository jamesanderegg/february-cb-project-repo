import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture, Html } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera";
import { useAgentController } from "../scene/AgentController";
import AgentDashboard from "./AgentDashboard";

const Buggy = forwardRef(({
  scale = 1,
  color,
  texturePath,
  visible = true,
  robotCameraRef,
  YOLOdetectObject,
  robotPositionRef,
  robotRotationRef,
  collisionIndicator,
  objectPositions,
  setObjectPositions,
}, ref) => {
  const buggyRef = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 4;
  const [showDashboard, setShowDashboard] = useState(false);

  // Initialize the agent controller hook
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
    setObjectPositions
  });

  console.log("Buggy initialized...");

  // Load GLTF Model & Texture
  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;

  // Add collision handlers
  const handleCollisionEnter = (event) => {
    const collidedObject = event.other.colliderObject;
    if (!collidedObject) return;

    console.log("🚨 Collision detected with:", collidedObject.name || "Unknown Object");

    // Ignore collisions with floor and hallway
    if (["RoomFloor", "HallFloor", "Plane"].includes(collidedObject.name)) {
      return;
    }

    // ✅ Mark collision
    collisionIndicator.current = true;

    // ✅ Trigger scene reset by clearing object positions
    console.log("🔄 Reset triggered due to collision!");
    setObjectPositions([]); // ✅ React will re-render, triggering reset
  };

  useEffect(() => {
    if (!loadedScene) return;
    loadedScene.traverse((child) => {
      if (child.isMesh) {
        if (color) child.material.color.set(color);
        if (texture) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [loadedScene, color, texture]);

  useEffect(() => {
    const handleKey = (event, isPressed) => {
      keysPressed.current[event.key] = isPressed;
    };

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));

    return () => {
      window.removeEventListener("keydown", (e) => handleKey(e, true));
      window.removeEventListener("keyup", (e) => handleKey(e, false));
    };
  }, []);

  useFrame(() => {
    if (!buggyRef.current) return;
    const body = buggyRef.current;
    let moveDirection = 0;
    let turnDirection = 0;
  
    if (keysPressed.current["w"]) moveDirection = moveSpeed;
    if (keysPressed.current["s"]) moveDirection = -moveSpeed;
    if (keysPressed.current["a"]) turnDirection = rotationSpeed;
    if (keysPressed.current["d"]) turnDirection = -rotationSpeed;
  
    // Get current rotation as Quaternion
    const currentRotation = new Quaternion().copy(body.rotation());
  
    // Apply rotation using correct Quaternion math
    if (turnDirection !== 0) {
      const turnQuaternion = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        turnDirection * 0.05
      );
      currentRotation.multiply(turnQuaternion);
      body.setRotation(currentRotation, true);
    }
  
    // Calculate movement direction relative to new rotation
    let forward = new Vector3(0, 0, -moveDirection);
    forward.applyQuaternion(currentRotation);
  
    body.setLinvel({ x: forward.x, y: body.linvel().y, z: forward.z }, true);
  
    // ✅ Extract translation (position)
    const { x, y, z } = body.translation();
  
    // ✅ Extract correct quaternion rotation
    const rotationQuat = body.rotation();
    const newRotation = [rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w];
  
    robotPositionRef.current = [x, y, z];
    robotRotationRef.current = newRotation;
  });

  // ✅ Expose resetBuggy() function to parent
  useImperativeHandle(ref, () => ({
    resetBuggy: () => {
      if (buggyRef.current) {
        console.log("🔄 Resetting Buggy...");
        const body = buggyRef.current;
  
        // Reset position
        body.setTranslation({ x: 7, y: 0.1, z: 15 }, true);
  
        // Correctly set rotation using Quaternion
        const resetQuaternion = new Quaternion();
        resetQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
        body.setRotation(resetQuaternion, true);
  
        // Reset velocity
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  }));

  // Toggle dashboard visibility
  const toggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };

  // Add keyboard shortcut for dashboard (e.g., "Tab")
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        toggleDashboard();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <RigidBody
        ref={buggyRef}
        type="dynamic"
        colliders="cuboid"
        position={[7, 0.1, 15]}
        rotation={[0, -Math.PI / 2, 0]}
        lockRotations={[true, false, true]}
        linearDamping={1000}
        angularDamping={1000}
        onCollisionEnter={handleCollisionEnter}
        name="buggy"
      >
        <group scale={scale} visible={visible}>
          <primitive object={loadedScene} />
        </group>

        <RobotCamera
          robotRef={buggyRef}
          ref={robotCameraRef}
          YOLOdetectObject={YOLOdetectObject}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          collisionIndicator={collisionIndicator}
          objectPositions={objectPositions}
        />
        <Html position={[0, 1.5, 0]} distanceFactor={10}>
          <div style={{ 
              padding: '2px 6px', 
              borderRadius: '4px',
              backgroundColor: agentStatus === 'idle' ? '#888' : 
                            agentStatus === 'training' ? '#ecc94b' : '#9f7aea',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {isConnected ? 
                (agentStatus === 'idle' ? 'Agent Ready' : 
                 agentStatus === 'training' ? 'Training' : 'AI Control') : 
                'Manual Control'}
                
              {lastAction && <span> | {lastAction.toUpperCase()}</span>}
          </div>
        </Html>
      </RigidBody>
      
      {/* Use Html from drei to mount UI elements in 3D space */}
      <Html fullscreen pointerEvents="none">
        {/* Dashboard toggle button */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000
        }}>
          <button 
            onClick={toggleDashboard}
            style={{
              padding: '5px 10px',
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              position: 'absolute',
              top: '4px',
              right: '60px',
              zIndex: '100',
              pointerEvents: 'auto' // Make this button clickable
            }}
          >
            {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
          </button>
        </div>
        
        {/* Dashboard overlay */}
        {showDashboard && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            pointerEvents: 'auto' // Make the dashboard clickable
          }}>
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
          </div>
        )}
      </Html>
    </>
  );
});

export default Buggy;