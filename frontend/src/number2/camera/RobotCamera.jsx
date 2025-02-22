import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef, onCaptureImage, onDetectionResults }, ref) => {
  const cameraRef = useRef();
  const helperRef = useRef();
  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));

  const hudImageData = useRef(null);

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
        gl.setRenderTarget(renderTarget.current);
        gl.render(scene, cameraRef.current);
        gl.setRenderTarget(null);
        gl.autoClear = true;

        const buffer = new Uint8Array(4 * renderTarget.current.width * renderTarget.current.height);
        gl.readRenderTargetPixels(renderTarget.current, 0, 0, renderTarget.current.width, renderTarget.current.height, buffer);

        // Create a canvas and flip image
        const canvas = document.createElement('canvas');
        canvas.width = renderTarget.current.width;
        canvas.height = renderTarget.current.height;
        const ctx = canvas.getContext('2d');

        // Create an ImageData object and flip it manually
        const imageData = new ImageData(new Uint8ClampedArray(buffer.buffer), renderTarget.current.width, renderTarget.current.height);

        // Create an offscreen canvas to store the flipped image
        const flippedCanvas = document.createElement('canvas');
        flippedCanvas.width = renderTarget.current.width;
        flippedCanvas.height = renderTarget.current.height;
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
    getHudImage: () => {
      
      return hudImageData.current || null;
    }
  }));

  useFrame(() => {
    if (robotRef.current && cameraRef.current) {
      const body = robotRef.current;
  
      // Get Buggy's world position
      const buggyPosition = new THREE.Vector3().copy(body.translation());
      buggyPosition.y += 2.5; // Adjust camera height
  
      // Get Buggy's world rotation
      const buggyRotation = new THREE.Quaternion().copy(body.rotation());
  
      // Calculate the forward direction of the buggy
      const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(buggyRotation);
  
      // Position the camera above the buggy
      cameraRef.current.position.copy(buggyPosition);
  
      // Look in the buggy's forward direction
      const lookTarget = new THREE.Vector3().copy(buggyPosition).add(lookDirection.multiplyScalar(5));
      cameraRef.current.lookAt(lookTarget);
  
      if (helperRef.current) {
        helperRef.current.update();
      }
  
      // Render to the target
      gl.setRenderTarget(renderTarget.current);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);
  
      // Read pixel data
      const width = renderTarget.current.width;
      const height = renderTarget.current.height;
      const buffer = new Uint8Array(4 * width * height);
      gl.readRenderTargetPixels(renderTarget.current, 0, 0, width, height, buffer);
  
      // Create an offscreen canvas to store the flipped image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
  
      // Create ImageData and manually flip the buffer vertically
      const imageData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        const srcRow = height - 1 - y; // Flip the rows
        const srcStart = srcRow * width * 4;
        const destStart = y * width * 4;
        imageData.data.set(buffer.subarray(srcStart, srcStart + width * 4), destStart);
      }
  
      // Draw the flipped image onto the canvas
      ctx.putImageData(imageData, 0, 0);
  
      // Convert to base64 and store it for the HUD
      hudImageData.current = canvas.toDataURL("image/png");
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
