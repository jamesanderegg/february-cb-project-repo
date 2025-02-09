import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";

const PiPCamera = ({ position = [0, 5, -10], lookAt = [0, 0, 0] }) => {
  const { gl, scene } = useThree();
  const pipCamera = useRef(new THREE.PerspectiveCamera(50, 1, 0.1, 100));
  const renderTarget = useFBO(512, 512); // Frame Buffer for PiP rendering

  useFrame(() => {
    // Ensure the camera exists before using it
    if (!pipCamera.current) return;

    // Set PiP Camera position and direction
    pipCamera.current.position.set(...position);
    pipCamera.current.lookAt(...lookAt);

    // Render the scene using the PiP Camera to the texture
    gl.setRenderTarget(renderTarget);
    gl.render(scene, pipCamera.current);
    gl.setRenderTarget(null); // Reset the render target to main screen
  });

  return (
    <mesh position={[5, 5, 2]} rotation={[0,.5,0]} scale={[2, 1.5, 1]}>
      <planeGeometry args={[2, 1.5]} />
      <meshBasicMaterial map={renderTarget.texture} />
    </mesh>
  );
};

export default PiPCamera;