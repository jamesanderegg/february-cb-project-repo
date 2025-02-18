import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DirectionalLight = ({
  color = "white",
  intensity = 1,
  position = [5, 10, 5],
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

      {/* Light Position Marker (Small Box) */}
      <mesh position={position}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Line from light to target */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="blue" />
      </line>
    </>
  );
};

export default DirectionalLight;
