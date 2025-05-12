import React, { useRef } from "react";
import { useHelper } from "@react-three/drei";
import { SpotLightHelper } from "three";
import { useFrame } from "@react-three/fiber";

export default function Spotlight({
  color = "white",
  intensity = 1,
  position = [5, 5, 5],
  angle = 0.3,
  penumbra = 0.1,
  distance = 10,
  decay = 1,
  targetPosition = [0, 0, 0],
  castShadow = true,
  shadowProps = { near: 0.5, far: 100, mapSize: [1024, 1024] },
  debug = false, // Set to true to visualize the spotlight helper
}) {
  const spotLightRef = useRef();
  const targetRef = useRef();

  useFrame(() => {
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.target.position.set(...targetPosition);
      spotLightRef.current.target.updateMatrixWorld();
    }
  });

  // Debug helper (optional)
  useHelper(debug && spotLightRef, SpotLightHelper, "cyan");

  return (
    <>
      <spotLight
        ref={spotLightRef}
        color={color}
        intensity={intensity}
        position={position}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={decay}
        castShadow={castShadow}
        shadow-camera-near={shadowProps.near}
        shadow-camera-far={shadowProps.far}
        shadow-mapSize-width={shadowProps.mapSize[0]}
        shadow-mapSize-height={shadowProps.mapSize[1]}
      />
      {/* Invisible target point to control direction */}
      <object3D ref={targetRef} position={targetPosition} />
    </>
  );
}
