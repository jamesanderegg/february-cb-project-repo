import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const RobotCamera = forwardRef((
  { robotRef,
    objectPositions,
    objectsInViewRef,
    onCaptureImage // New prop to send image data to parent
  }, ref) => {
  const cameraRef = useRef();
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  offscreenCanvasRef.current.width = 640;
  offscreenCanvasRef.current.height = 640;

  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10);
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
    if (robotRef.current && cameraRef.current) {
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
     
      const visibleObjects = objectPositions.filter(({ position }) => {
        const objectVector = new THREE.Vector3(position[0], position[1], position[2]);
        const cameraToObject = objectVector.clone().sub(cameraRef.current.position);
        const dotProduct = cameraToObject.dot(lookDirection);
        const isInFront = dotProduct > 0;
        const isVisible = isInFront && frustum.containsPoint(objectVector);

        return isVisible;
      });

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