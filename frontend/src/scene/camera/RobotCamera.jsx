import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef, onCaptureImage, onDetectionResults }, ref) => {
  const cameraRef = useRef();
  const helperRef = useRef();
  const { gl, scene } = useThree();
  const renderTarget = new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }); // Adjusted for YOLO

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 15);
    cameraRef.current = camera;
    scene.add(camera);

    const helper = new THREE.CameraHelper(camera);
    scene.add(helper);
    helperRef.current = helper;

    return () => {
      scene.remove(camera);
      if (helperRef.current) {
        scene.remove(helperRef.current);
      }
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    captureImage: async () => {
      try {
        gl.autoClear = false;
        gl.setRenderTarget(renderTarget);
        gl.render(scene, cameraRef.current);
        gl.setRenderTarget(null);
        gl.autoClear = true;

        const buffer = new Uint8Array(4 * renderTarget.width * renderTarget.height);
        gl.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, buffer);

        const flippedData = new Uint8ClampedArray(buffer.buffer);
        const canvas = document.createElement('canvas');
        canvas.width = renderTarget.width;
        canvas.height = renderTarget.height;
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(flippedData, renderTarget.width, renderTarget.height);
        ctx.putImageData(imageData, 0, 0);

        const base64Image = canvas.toDataURL("image/png");

        if (onCaptureImage) {
          onCaptureImage(base64Image);
        }

        // Send image to YOLO for detection
        const detectionResults = await sendToYOLO(base64Image);
        if (onDetectionResults) {
          onDetectionResults(detectionResults); // Handle results in parent component
        }

        return base64Image;
      } catch (error) {
        console.error("Error in captureImage:", error);
        return null;
      }
    },
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
      lookTarget.y -= 1;
      cameraRef.current.lookAt(lookTarget);

      if (helperRef.current) {
        helperRef.current.update();
      }
    }
  });

  return null;
});

// Function to preprocess image for YOLO
async function preprocessImage(base64Image) {
  const img = new Image();
  img.src = base64Image;
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 640;
  canvas.height = 640;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png"); 
}

// Function to send image to YOLO backend
async function sendToYOLO(base64Image) {
  try {
    const processedImage = await preprocessImage(base64Image);
    const response = await fetch('http://your-backend-endpoint/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: processedImage }),
    });

    const detectionResults = await response.json();
    console.log("YOLO Detection Results:", detectionResults);
    return detectionResults;
  } catch (error) {
    console.error("Error sending image to YOLO:", error);
    return null;
  }
}

export default RobotCamera;
