import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useFBO } from "@react-three/drei";
import * as THREE from "three";

// Robot Camera Component
export default function RobotCamera({ robotRef }) {
  const cameraRef = useRef();
  const lineRef = useRef();
  const ballRef = useRef();
  const miniMapRef = useRef();
  const helperRef = useRef();

  const { camera, gl, scene } = useThree();
  const renderTarget = useFBO(512, 512);

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

  useFrame(() => {
    if (
      robotRef.current &&
      cameraRef.current &&
      lineRef.current &&
      ballRef.current &&
      miniMapRef.current
    ) {
      // Attach camera to robot head position
      const headPosition = robotRef.current.position.clone();
      headPosition.y += 2.5;

      cameraRef.current.position.copy(headPosition);
      cameraRef.current.lookAt(headPosition.x, headPosition.y, headPosition.z - 5);

      // Ball representing camera position
      ballRef.current.position.copy(headPosition);

      // Update line to show camera's vision range
      const nearPoint = new THREE.Vector3();
      const farPoint = new THREE.Vector3();

      cameraRef.current.getWorldPosition(nearPoint);
      cameraRef.current.getWorldDirection(farPoint);
      nearPoint.addScaledVector(farPoint, cameraRef.current.near);
      farPoint.addScaledVector(farPoint, cameraRef.current.far);

      lineRef.current.geometry.setFromPoints([nearPoint, farPoint]);

      // Update CameraHelper
      if (helperRef.current) {
        helperRef.current.update();
      }

      // Render the camera's view into render target
      gl.setRenderTarget(renderTarget);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);

      // Mini-map positioning relative to main camera
      const miniMapOffset = new THREE.Vector3(1.45, -0.35, -5);
      miniMapOffset.applyMatrix4(camera.matrixWorld);
      miniMapRef.current.position.copy(miniMapOffset);
      miniMapRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <>
      {/* Perspective Camera */}
      <PerspectiveCamera ref={cameraRef} fov={60} aspect={1} near={1} far={10} />

      {/* Ball to visualize camera's position */}
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      {/* Line to show camera's vision range */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="red" linewidth={2} />
      </line>

      {/* Mini-map (PiP) */}
      <mesh ref={miniMapRef} scale={[0.7, 0.5, 0]}>
        <planeGeometry />
        <meshBasicMaterial map={renderTarget.texture} />
      </mesh>
    </>
  );
}
