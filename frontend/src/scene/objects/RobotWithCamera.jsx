import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useFBO } from "@react-three/drei";
import * as THREE from "three";

import Model from "../../helper/Model";

export default function RobotWithCamera({ position }) {
  const robotRef = useRef();
  const cameraRef = useRef();
  const lineRef = useRef();
  const ballRef = useRef();
  const coneRef = useRef();

  // Create an FBO (Frame Buffer Object) for rendering the PiP camera
  const renderTarget = useFBO(512, 512);

  useFrame(({ gl, scene }) => {
    if (robotRef.current && cameraRef.current && lineRef.current && ballRef.current && coneRef.current) {
      // Attach the camera to the robot’s head position
      const headPosition = robotRef.current.position.clone();
      headPosition.y += 2; // Assume the head is 2 units above the base

      cameraRef.current.position.copy(headPosition);
      cameraRef.current.lookAt(headPosition.x, headPosition.y, headPosition.z - 5); // Look ahead

      // Ball to show where the camera is
      ballRef.current.position.copy(headPosition);

      // Cone to show where the camera is pointing
      const conePosition = new THREE.Vector3(headPosition.x, headPosition.y, headPosition.z - 2);
      coneRef.current.position.copy(conePosition);
      coneRef.current.lookAt(new THREE.Vector3(headPosition.x, headPosition.y, headPosition.z - 5));

      // Update the line to visualize the camera's view direction
      const endPosition = new THREE.Vector3(
        headPosition.x,
        headPosition.y,
        headPosition.z - 5 // Extend the line 5 units forward
      );
      lineRef.current.geometry.setFromPoints([headPosition, endPosition]);

      // Render the robot's view into the render target
      gl.setRenderTarget(renderTarget);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);
    }
  });

  return (
    <>
      {/* Robot Model */}
      <Model ref={robotRef} filePath="robot.glb" scale={0.02} position={position} />

      {/* Robot Camera */}
      <PerspectiveCamera ref={cameraRef} fov={60} aspect={1} near={0.1} far={1000} />

      {/* Ball to show camera's position */}
      <mesh ref={ballRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      {/* Cone to indicate the camera's direction */}
      <mesh ref={coneRef} position={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.8, 16]} />
        <meshStandardMaterial color="yellow" />
      </mesh>

      {/* Line to show camera's vision range */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="red" linewidth={2} />
      </line>

      {/* Mini-map as a live-rendered PiP display */}
      <mesh position={[1.5, 3, -3]} scale={[10, 10, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={renderTarget.texture} />
      </mesh>
    </>
  );
}
