import React, { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera"; // Import RobotCamera

const Buggy = ({ 
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, -Math.PI / 2, 0],
  color,
  texturePath,
  visible = true,
  robotCameraRef,
  robotPositionRef, 
  robotRotationRef,
  YOLOdetectObject
}) => {
  const ref = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 1.5;

  const collisionDetectedRef = useRef(false); 

  // Load GLTF Model & Texture
  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;

  // Add missing collision handlers
  const handleCollisionEnter = () => {
    collisionDetectedRef.current = true;
  };

  const handleCollisionExit = () => {
    collisionDetectedRef.current = false;
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
    if (!ref.current) return;
    const body = ref.current;
    let moveDirection = 0;
    let turnDirection = 0;
    
  
    // Movement Input
    if (keysPressed.current["w"]) moveDirection = moveSpeed;
    if (keysPressed.current["s"]) moveDirection = -moveSpeed;
    if (keysPressed.current["a"]) turnDirection = rotationSpeed; // Left
    if (keysPressed.current["d"]) turnDirection = -rotationSpeed; // Right
  
    // Get current rotation as Quaternion
    const currentRotation = new Quaternion().copy(body.rotation());
  
    // Apply rotation
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
  
    // ✅ Extract quaternion rotation correctly
    const rotationQuat = body.rotation(); // Get Quaternion object
    const newRotation = [rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w];
  
    robotPositionRef.current = [x, y, z];
    robotRotationRef.current = newRotation; // Store as an array
  });

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      colliders="cuboid"
      position={position}
      rotation={rotation}
      lockRotations={[true, false, true]} // Allow Y rotation, lock X/Z
      linearDamping={1000}
      angularDamping={1000}
      onCollisionEnter={handleCollisionEnter} 
      onCollisionExit={handleCollisionExit}
      name="buggy"
    >
      <group scale={scale} visible={visible}>
        <primitive object={loadedScene} />
      </group>

      {/* ✅ Attach Robot Camera for streaming */}
      <RobotCamera robotRef={ref} ref={robotCameraRef} YOLOdetectObject={YOLOdetectObject} />
    </RigidBody>
  );
};

export default Buggy;