import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef, onCaptureImage, onDetectionResults }, ref) => {
  const cameraRef = useRef();
  const helperRef = useRef();
  const { gl, scene } = useThree();
  const renderTarget = new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false });

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

        // Create a canvas and flip image
        const canvas = document.createElement('canvas');
        canvas.width = renderTarget.width;
        canvas.height = renderTarget.height;
        const ctx = canvas.getContext('2d');

        // Create an ImageData object and flip it manually
        const imageData = new ImageData(new Uint8ClampedArray(buffer.buffer), renderTarget.width, renderTarget.height);

        // Create an offscreen canvas to store the flipped image
        const flippedCanvas = document.createElement('canvas');
        flippedCanvas.width = renderTarget.width;
        flippedCanvas.height = renderTarget.height;
        const flippedCtx = flippedCanvas.getContext('2d');

        // Flip the image by scaling and drawing the original imageData
        flippedCtx.putImageData(imageData, 0, 0);
        ctx.scale(1, -1);
        ctx.drawImage(flippedCanvas, 0, -canvas.height);

        // Convert to base64 image
        const base64Image = canvas.toDataURL("image/png");

        if (onCaptureImage) {
          onCaptureImage(base64Image);
        }

        const detectionResults = await sendToYOLO(base64Image);
        console.log("Detection Results:", detectionResults);
        if (onDetectionResults) {
          onDetectionResults(detectionResults);
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

async function sendToYOLO(base64Image) {
  try {
    const processedImage = await preprocessImage(base64Image);
    const response = await fetch('/robot', {
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
