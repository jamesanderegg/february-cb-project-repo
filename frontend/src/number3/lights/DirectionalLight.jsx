import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Single DirectionalLight component
const SingleLight = ({
  color = "white",
  intensity = 1,
  position,
  targetPosition = [0, 0, 0],
  castShadow = true,
  shadowProps = {
    near: 0.5,
    far: 500,
    mapSize: [1024, 1024],
  },
}) => {
  const lightRef = useRef();
  const targetRef = useRef();
  const lineRef = useRef();

  useFrame(() => {
    if (lightRef.current && targetRef.current && lineRef.current) {
      // Update light's target position
      lightRef.current.target.position.set(...targetPosition);
      lightRef.current.target.updateMatrixWorld();

      // Update the line
      const positions = new Float32Array([...position, ...targetPosition]);
      lineRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    }
  });

  return (
    <>
      {/* Directional Light */}
      <directionalLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        position={position}
        castShadow={castShadow}
        shadow-camera-near={shadowProps.near}
        shadow-camera-far={shadowProps.far}
        shadow-mapSize-width={shadowProps.mapSize[0]}
        shadow-mapSize-height={shadowProps.mapSize[1]}
      />

      {/* Target Helper */}
      <object3D ref={targetRef} position={targetPosition} />

      {/* Light Position Markers (Small Box) */}
      <mesh position={position}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshBasicMaterial color="royalblue" />
      </mesh>
      
      {/* Line from light to target */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="blue" />
      </line>
    </>
  );
};

  // Main component with multiple lights
const DirectionalLights = ({ 
  castShadow = true,
  shadowProps = {
    near: 0.5,
    far: 500,
    mapSize: [1024, 1024],
  },
}) => {
  // Define all light positions
  const lightPositions = [
    [0, 10, 0],
    [10, 10, -20],
    [1, 10, 24],
    [30, 10, 24],
    [20, 10, 4.5]
  ];

  // Different colors for easier identification
  const lightColors = [
    "#FFFFFF", // white
    "#FFFFAA", // warm white
    "#AAFFFF", // cool white
    "#FFAAAA", // subtle red
    "#AAFFAA"  // subtle green
  ];

  // Intensity for each light
  const intensities = [0.8, 0.7, 0.7, 0.7, 0.7];

  return (
    <>
      {lightPositions.map((position, index) => {
        // Calculate target position directly below the light (straight down)
        const targetPosition = [position[0], 0, position[2]];
        
        return (
          <SingleLight
            key={`light-${index}`}
            position={position}
            color={lightColors[index]}
            intensity={intensities[index]}
            targetPosition={targetPosition}
            castShadow={castShadow}
            shadowProps={shadowProps}
          />
        );
      })}
    </>
  );
};

export default DirectionalLights;