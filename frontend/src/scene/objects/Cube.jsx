import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const Cube = ({
  size = [1, 1, 1], // Default size
  color = "blue",   // Default color
  position = [0, 0, 0], // Default position
  rotation = [0, 0, 0], // Default rotation
  rotationSpeed = [0, 0, 0], // Default rotation speed
  castShadow = true,    // Option to cast shadows
  receiveShadow = false // Option to receive shadows
}) => {
  const cubeRef = useRef();

  // Animate the cube rotation
  useFrame(() => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += rotationSpeed[0];
      cubeRef.current.rotation.y += rotationSpeed[1];
      cubeRef.current.rotation.z += rotationSpeed[2];
    }
  });

  return (
    <mesh
      ref={cubeRef}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default Cube;
