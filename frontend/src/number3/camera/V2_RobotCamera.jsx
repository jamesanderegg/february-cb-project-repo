import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const RobotCamera = forwardRef((
  { robotRef,
    objectPositions,
    objectsInViewRef,
    modelPositionsRef,
    onCaptureImage // New prop to send image data to parent
  }, ref) => {
  const cameraRef = useRef();
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  offscreenCanvasRef.current.width = 640;
  offscreenCanvasRef.current.height = 640;

  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(75, 1, 1, 10);
    cameraRef.current = camera;
    scene.add(camera);

    return () => {
      scene.remove(camera);
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    getHudImage: () => offscreenCanvasRef.current.toDataURL("image/png"),
  }));

  useFrame(() => {
    if (robotRef.current && cameraRef.current && modelPositionsRef.current) {
      const body = robotRef.current;

      // Get robot position & rotation
      const buggyPosition = new THREE.Vector3().copy(body.translation());
      buggyPosition.y += 2.5;
      const buggyRotation = new THREE.Quaternion().copy(body.rotation());
      const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(buggyRotation);

      // Update camera position and orientation
      cameraRef.current.position.copy(buggyPosition);
      const lookTarget = new THREE.Vector3().copy(buggyPosition).add(lookDirection.multiplyScalar(5));
      cameraRef.current.lookAt(lookTarget);

      // ✅ Compute the Camera's Frustum
      const frustum = new THREE.Frustum();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(
        cameraRef.current.projectionMatrix,
        cameraRef.current.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(projScreenMatrix);
     
      // Get data from dynamic model positions ref instead of objectPositions array
      const visibleObjects = Object.entries(modelPositionsRef.current)
        .map(([id, data]) => {
          // Find matching object in objectPositions to get additional metadata
          const originalObj = objectPositions.find(obj => obj.id === id) || { id };
          
          // Create position vector from current dynamic position
          const positionVec = new THREE.Vector3(
            data.position[0],  // X from dynamic position
            1.25,              // Static Y height of 1.25
            data.position[2]   // Z from dynamic position
          );;
          
          const cameraToObject = positionVec.clone().sub(cameraRef.current.position);
          const dotProduct = cameraToObject.dot(lookDirection);
          const isInFront = dotProduct > 0;
          const isVisible = isInFront && frustum.containsPoint(positionVec);

          if (!isVisible) return null;

          // Project to normalized device coordinates (NDC)
          const projected = positionVec.clone().project(cameraRef.current); // now in NDC space [-1, 1]

          // Distance from screen center (0,0) in NDC space
          const ndcDistanceFromCenter = Math.sqrt(projected.x ** 2 + projected.y ** 2);

          return {
            ...originalObj,
            id,
            position: data.position,
            rotation: data.rotation,
            distance: cameraToObject.length(),
            ndcDistanceFromCenter,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.ndcDistanceFromCenter - b.ndcDistanceFromCenter); // closest to center first

      objectsInViewRef.current = visibleObjects;

      // Render the scene to a render target
      gl.setRenderTarget(renderTarget.current);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);

      // Read pixel data from render target
      const width = renderTarget.current.width;
      const height = renderTarget.current.height;
      const buffer = new Uint8Array(4 * width * height);
      gl.readRenderTargetPixels(renderTarget.current, 0, 0, width, height, buffer);

      // Flip the image vertically
      const canvas = offscreenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        const srcRow = height - 1 - y;
        const srcStart = srcRow * width * 4;
        const destStart = y * width * 4;
        imageData.data.set(buffer.subarray(srcStart, srcStart + width * 4), destStart);
      }
      ctx.putImageData(imageData, 0, 0);

      // Send the image to parent for processing
      canvas.toBlob((blob) => {
        if (blob && onCaptureImage) {
          onCaptureImage(blob);
        }
      }, "image/png");
    }
  });

  return null;
});

export default RobotCamera;