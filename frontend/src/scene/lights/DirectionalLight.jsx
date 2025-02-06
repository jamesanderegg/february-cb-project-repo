import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const DirectionalLight = ({
  color = "white",       // Default color
  intensity = 1,         // Default intensity
  position = [5, 10, 5], // Default position
  targetPosition = [0, 0, 0], // Target's position
  castShadow = true,     // Enable shadow casting
  shadowProps = {        // Shadow map properties
    near: 0.5,
    far: 500,
    mapSize: [1024, 1024]
  }
}) => {
  const lightRef = useRef();
  const targetRef = useRef();

  useFrame(() => {
    if (targetRef.current && lightRef.current) {
      lightRef.current.target.position.set(...targetPosition);
      lightRef.current.target.updateMatrixWorld(); // Ensure target updates
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
      
      {/* Target Object (Invisible but helps position light target) */}
      <object3D ref={targetRef} position={targetPosition} />
    </>
  );
};

export default DirectionalLight;
