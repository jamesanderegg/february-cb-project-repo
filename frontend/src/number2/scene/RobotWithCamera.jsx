import React, { useRef, useState, useEffect } from "react";
import RobotCamera from "../camera/RobotCamera";
import RobotModel from "../helper/RobotModel";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function RobotWithCamera({ position, robotCameraRef }) {
  const robotRef = useRef(null);
  const keysPressed = useRef(new Set());

  // Handle key press events
  useEffect(() => {
    const handleKeyDown = (event) => keysPressed.current.add(event.key);
    const handleKeyUp = (event) => keysPressed.current.delete(event.key);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Apply physics-based movement
  useFrame(() => {
    if (robotRef.current) {
      const body = robotRef.current;
      const linvel = body.linvel();
      const currentRotation = body.rotation();
      let forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w)
      );

      let newVelocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z);

      // Apply acceleration
      const acceleration = 2;
      if (keysPressed.current.has("w") || keysPressed.current.has("ArrowUp")) {
        newVelocity.addScaledVector(forward, acceleration);
      }
      if (keysPressed.current.has("s") || keysPressed.current.has("ArrowDown")) {
        newVelocity.addScaledVector(forward, -acceleration);
      }

      // Apply rotation
      const turnSpeed = Math.PI / 180 * 3;
      if (keysPressed.current.has("a") || keysPressed.current.has("ArrowLeft")) {
        body.setAngvel({ x: 0, y: turnSpeed, z: 0 }, true);
      } else if (keysPressed.current.has("d") || keysPressed.current.has("ArrowRight")) {
        body.setAngvel({ x: 0, y: -turnSpeed, z: 0 }, true);
      } else {
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }

      // Limit speed
      const maxSpeed = 3;
      if (newVelocity.length() > maxSpeed) {
        newVelocity.clampLength(0, maxSpeed);
      }

      // Apply friction
      newVelocity.multiplyScalar(0.95);

      // Apply velocity and keep upright
      body.setLinvel({ x: newVelocity.x, y: 0, z: newVelocity.z }, true);
      body.setRotation({ x: 0, y: currentRotation.y, z: 0, w: currentRotation.w }, true);
    }
  });

  return (
    <>
      {/* Robot Model */}
      <RobotModel
        ref={robotRef}
        filePath="robot.glb"
        scale={0.02}
        position={position || [0, 1.5, 0]} // Raised slightly to prevent sinking
        physicsProps={{
          mass: 5,
          linearDamping: 0.5,
          angularDamping: 0.5
        }}
      />
    </>
  );
}
