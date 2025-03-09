import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera"; // Import RobotCamera

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
  setObjectPositions
}, ref) => {
  const buggyRef = useRef();  // ✅ Corrected use of ref
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 4;

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
  

  return (
    <RigidBody
      ref={buggyRef}
      type="dynamic"
      colliders="cuboid"
      position={[7, 0.1, 15]} // Default Position
      rotation={[0, -Math.PI / 2, 0]} // Default Rotation
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
    </RigidBody>
  );
});

export default Buggy;
