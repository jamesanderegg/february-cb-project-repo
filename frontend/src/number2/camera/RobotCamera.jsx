import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { io } from "socket.io-client";

// WebSocket connection
const socket = io("http://127.0.0.1:5001");

const RobotCamera = forwardRef(({ robotRef, YOLOdetectObject, robotPositionRef, robotRotationRef, collisionIndicator }, ref) => {
  const cameraRef = useRef();
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  // Set canvas size to match render target dimensions
  offscreenCanvasRef.current.width = 640;
  offscreenCanvasRef.current.height = 640;

  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));
  const isProcessing = useRef(false);

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
        captureAndSendImage(); // This may be used to force a capture if needed.
      }
    },
    // Expose the latest image (if needed)
    getHudImage: () => offscreenCanvasRef.current.toDataURL("image/png"),
  }));

  useFrame(() => {
    if (robotRef.current && cameraRef.current) {
      const body = robotRef.current;

      // Calculate Buggy's world position and adjust camera height
      const buggyPosition = new THREE.Vector3().copy(body.translation());
      buggyPosition.y += 2.5;

      // Calculate Buggy's rotation and look direction
      const buggyRotation = new THREE.Quaternion().copy(body.rotation());
      const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(buggyRotation);

      // Update camera position and orientation
      cameraRef.current.position.copy(buggyPosition);
      const lookTarget = new THREE.Vector3().copy(buggyPosition).add(lookDirection.multiplyScalar(5));
      cameraRef.current.lookAt(lookTarget);

      // Render the scene to our render target
      gl.setRenderTarget(renderTarget.current);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);

      // Read pixel data from the render target
      const width = renderTarget.current.width;
      const height = renderTarget.current.height;
      const buffer = new Uint8Array(4 * width * height);
      gl.readRenderTargetPixels(renderTarget.current, 0, 0, width, height, buffer);

      // Reuse our offscreen canvas to flip the image vertically
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

      // If not already processing, capture the canvas as a Blob and send it.
      if (!isProcessing.current) {
        canvas.toBlob((blob) => {
          if (blob) {
            captureAndSendImage(blob);
          }
        }, "image/png");
      }
    }
  });

  async function captureAndSendImage(imageBlob) {
    if (!imageBlob) {
      console.warn("No image available for YOLO processing.");
      return;
    }
  
    // Capture the current timestamp (in milliseconds)
    const captureTimestamp = Date.now();
  
    isProcessing.current = true; // Lock new requests until YOLO responds
  
    const robotPosition = robotPositionRef.current;
    const robotRotation = robotRotationRef.current;
    const collision = collisionIndicator.current;
  
    // Send binary image & metadata over WebSocket, including the timestamp
    socket.emit("send_frame", {
      image: imageBlob, 
      position: robotPosition,
      rotation: robotRotation,
      collisionIndicator: collision,
      timestamp: captureTimestamp, // embed capture time
    });
  }
  

  // Listen for YOLO detection results from the server
  useEffect(() => {
    socket.on("detection_results", (detectionResults) => {
      console.log("YOLO Detection Results:", detectionResults);
      YOLOdetectObject.current = detectionResults;
      isProcessing.current = false;
    });

    return () => {
      socket.off("detection_results");
    };
  }, []);

  return null;
});

export default RobotCamera;
