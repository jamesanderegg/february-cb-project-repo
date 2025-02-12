import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useFBO } from "@react-three/drei";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef }, ref) => {
  const cameraRef = useRef();
  const ballRef = useRef();
  const miniMapRef = useRef();
  const helperRef = useRef();
  
  const { gl, scene } = useThree();
  const renderTarget = useFBO(512, 512); // Create a framebuffer object

  useEffect(() => {
    if (cameraRef.current) {
      const helper = new THREE.CameraHelper(cameraRef.current);
      scene.add(helper);
      helperRef.current = helper;
    }

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    captureImage: async () => {
      try {
        // Ensure the WebGL scene is fully rendered before capturing
        gl.setRenderTarget(renderTarget);
        gl.render(scene, cameraRef.current);
        gl.setRenderTarget(null); // Reset render target
  
        // Convert WebGL Canvas to Base64 Image
        const base64Image = gl.domElement.toDataURL("image/png");
  
        console.log("Generated Base64 Image:", base64Image);
        return base64Image;
      } catch (error) {
        console.error("Error in captureImage:", error);
        return null;
      }
    }
  }));
  
  
  useFrame(() => {
    if (robotRef.current && cameraRef.current) {
      const headPosition = robotRef.current.position.clone();
      headPosition.y += 2.5;

      const robotRotation = robotRef.current.rotation.y;
      const lookDirection = new THREE.Vector3(
        -Math.sin(robotRotation),
        0,
        -Math.cos(robotRotation)
      );

      cameraRef.current.position.copy(headPosition);
      const lookTarget = headPosition.clone().add(lookDirection.multiplyScalar(5));
      lookTarget.y -= 0.9;
      cameraRef.current.lookAt(lookTarget);

      if (helperRef.current) {
        helperRef.current.update();
      }
    }
  });

  return (
    <>
      {/* Perspective Camera */}
      <PerspectiveCamera ref={cameraRef} fov={45} aspect={1} near={1} far={15} />
    </>
  );
});

export default RobotCamera;
