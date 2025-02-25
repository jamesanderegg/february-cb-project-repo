import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef, YOLOdetectObject }, ref) => {
  const cameraRef = useRef();
  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));
  const hudImageData = useRef(null);
  const isProcessing = useRef(false); // Prevents sending another image before response

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 15);
    cameraRef.current = camera;
    scene.add(camera);

    return () => {
      scene.remove(camera);
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    startStreaming: () => {
      if (!isProcessing.current) {
        captureAndSendImage();
      }
    },
    getHudImage: () => hudImageData.current, // ✅ Ensure HUD can access the latest image
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
  
      // ✅ Update HUD image every frame
      hudImageData.current = canvas.toDataURL("image/png");

      // ✅ Send to YOLO only if no request is currently being processed
      if (!isProcessing.current) {
        captureAndSendImage(hudImageData.current);
      }
    }
  });

  async function captureAndSendImage(image) {
    try {
      if (!image) {
        console.warn("No image available for YOLO processing.");
        return;
      }

      isProcessing.current = true; // Lock new requests until YOLO responds

      const response = await fetch("http://127.0.0.1:5000/robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      // pass into App.jsx
      const detectionResults = await response.json();
      console.log("YOLO Detection Results:", detectionResults);

      YOLOdetectObject.current = detectionResults;

      // ✅ Once YOLO responds, process the next image
      isProcessing.current = false;
    } catch (error) {
      console.error("Error sending image to YOLO:", error);
      isProcessing.current = false;
    }
  }

  return null;
});

export default RobotCamera;
