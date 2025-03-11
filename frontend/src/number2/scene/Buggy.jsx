import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture, Html } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera";
import { useAgentController } from "./AgentController";
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
  setObjectPositions,
  targetObject = 0 // Add default value for targetObject
}, ref) => {
  const buggyRef = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 4;
  const [showDashboard, setShowDashboard] = useState(false);

  // Rest of your code...

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
      
      {/* Dashboard overlay */}
      {showDashboard && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000
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
    </>
  );
});

export default Buggy;