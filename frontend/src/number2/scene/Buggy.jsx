import React, { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Euler, Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";

const Buggy = ({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  texturePath,
  visible = true,
}) => {
  const ref = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 50;
  const rotationSpeed = 1.5;

  // Load GLTF Model & Texture
  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;

  // Apply color/texture to the model
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

  // Key press handling
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

  // Frame loop for movement
  useFrame(() => {
    if (!ref.current) return;
    const body = ref.current;
    let moveDirection = 0;
    let turnDirection = 0;
  
    // Movement Input
    if (keysPressed.current["w"]) moveDirection = moveSpeed;
    if (keysPressed.current["s"]) moveDirection = -moveSpeed;
    if (keysPressed.current["a"]) turnDirection = rotationSpeed; // Left (Counter-clockwise)
    if (keysPressed.current["d"]) turnDirection = -rotationSpeed; // Right (Clockwise)
  
    // Get current rotation as Quaternion
    const currentRotation = new Quaternion().copy(body.rotation());
  
    // Apply rotation using Quaternion transformation (Ensures proper spinning)
    if (turnDirection !== 0) {
      const turnQuaternion = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0), // Rotate around Y-axis
        turnDirection * 0.05 // Adjust rotation speed
      );
      currentRotation.multiply(turnQuaternion); // Apply rotation
      body.setRotation(currentRotation, true);
    }
  
    // Calculate movement direction **relative to new rotation**
    let forward = new Vector3(0, 0, -moveDirection); // Forward in local space
    forward.applyQuaternion(currentRotation); // Rotate movement vector to match facing direction
  
    // Apply movement
    body.setLinvel({ x: forward.x, y: body.linvel().y, z: forward.z }, true);
  });
  

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      colliders="cuboid"
      position={position}
      rotation={rotation}
      lockRotations={[true, false, true]} // Allow Y rotation, lock X/Z
      linearDamping={1000} // Smooth movement
      angularDamping={1000}
     
    >
      <group scale={scale} visible={visible}>
        <primitive object={loadedScene} />
      </group>
    </RigidBody>
  );
};

export default Buggy;
