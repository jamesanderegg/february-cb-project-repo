import React, { useRef, useState, useEffect } from "react";
import RobotCamera from "../camera/RobotCamera";
import Model from "../../helper/Model";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Main Robot Component
export default function RobotWithCamera({ position, robotCameraRef }) {
  const robotRef = useRef();

  // Movement state
  const [robotPosition, setRobotPosition] = useState(position || [0, 0, 0]);
  const [rotation, setRotation] = useState(0); // Rotation in radians

  // Velocity state
  const velocity = useRef(new THREE.Vector3(0, 0, 0)); // Movement speed
  const angularVelocity = useRef(0); // Rotation speed

  // Movement constants
  const acceleration = 0.02; // Speed increase
  const maxSpeed = 0.2; // Max speed
  const turnSpeed = Math.PI / 180 * 2; // 2-degree rotation per frame
  const friction = 0.95; // Slow down movement

  // Track pressed keys
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

  // Apply movement, rotation, and leaning effect smoothly
  useFrame(() => {
    if (robotRef.current) {
      let newVelocity = velocity.current.clone();
      let newRotation = rotation;

      // Apply acceleration in current direction
      if (keysPressed.current.has("w")) {
        newVelocity.x -= acceleration * Math.sin(rotation);
        newVelocity.z -= acceleration * Math.cos(rotation);
      }
      if (keysPressed.current.has("s")) {
        newVelocity.x += acceleration * Math.sin(rotation);
        newVelocity.z += acceleration * Math.cos(rotation);
      }

      // Apply rotation
      if (keysPressed.current.has("a")) newRotation += turnSpeed;
      if (keysPressed.current.has("d")) newRotation -= turnSpeed;

      // Limit speed
      newVelocity.clampLength(0, maxSpeed);

      // Apply damping (friction)
      newVelocity.multiplyScalar(friction);

      // Update position and rotation
      const newPos = [
        robotPosition[0] + newVelocity.x,
        robotPosition[1],
        robotPosition[2] + newVelocity.z,
      ];

      setRobotPosition(newPos);
      setRotation(newRotation);

      // Update Three.js object position
      robotRef.current.position.set(...newPos);
      robotRef.current.rotation.y = newRotation;

      // 🏎️ **Apply Lean Effect (Tilt Robot)**
      const tiltFactor = 0.05; // Adjust for more/less lean
      robotRef.current.rotation.z = -newVelocity.x * tiltFactor; // Tilt side-to-side when turning
      robotRef.current.rotation.x = newVelocity.z * tiltFactor; // Tilt faorward/backward when moving

      // Store new velocity
      velocity.current.copy(newVelocity);
    }
  });

  return (
    <>
      {/* Robot Model */}
      <Model ref={robotRef} filePath="robot.glb" scale={0.02} position={robotPosition} />

      {/* Camera attached to the robot */}
      <RobotCamera ref={robotCameraRef} robotRef={robotRef} />
    </>
  );
}
