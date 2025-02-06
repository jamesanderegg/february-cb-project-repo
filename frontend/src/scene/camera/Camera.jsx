import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const Camera = ({ position = [0, 5, 10], lookAt = [0, 0, 0] }) => {
  const cameraRef = useRef();

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(...lookAt);
    }
  });

  return <perspectiveCamera ref={cameraRef} position={position} />;
};

export default Camera;
