import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Google Colab API URL (replace this after starting Colab Flask)
const COLAB_API_URL = "https://1acd-104-199-170-14.ngrok-free.app/receive_image";

const RobotCamera = forwardRef(({ robotRef, YOLOdetectObject, robotPositionRef, robotRotationRef, collisionIndicator, objectPositions }, ref) => {
  const cameraRef = useRef();
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  offscreenCanvasRef.current.width = 640;
  offscreenCanvasRef.current.height = 640;

  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));
  const isProcessing = useRef(false);
  const imageCount = useRef(0);  // Track number of images sent
  const frustumHelperRef = useRef(null);

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10);
    cameraRef.current = camera;
    scene.add(camera);

    // ✅ Add a Frustum Helper (renders the frustum as a visible wireframe)
    const frustumHelper = new THREE.CameraHelper(camera);
    scene.add(frustumHelper);
    frustumHelperRef.current = frustumHelper;

    return () => {
      scene.remove(camera);
      scene.remove(frustumHelper);
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    startStreaming: () => {
      if (!isProcessing.current) {
        captureAndSendImage();
      }
    },
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

      // ✅ Debug Frustum
      console.log("🧩 Frustum Matrix:", projScreenMatrix.elements);

      // ✅ Update the Frustum Helper to match new position
      if (frustumHelperRef.current) {
        frustumHelperRef.current.update();
      }

     

      const visibleObjects = objectPositions.filter(({ position }) => {
        const objectVector = new THREE.Vector3(position[0], position[1], position[2]);
        const cameraToObject = objectVector.clone().sub(cameraRef.current.position);
        const dotProduct = cameraToObject.dot(lookDirection);
        const isInFront = dotProduct > 0;
        const isVisible = isInFront && frustum.containsPoint(objectVector);        

        return isVisible;
      });

      console.log("📸 Objects in View:", visibleObjects);



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

    if (isProcessing.current) {
      return;
    }

    isProcessing.current = true;
    imageCount.current += 1;

    const reader = new FileReader();
    reader.readAsDataURL(imageBlob);
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const response = await fetch(COLAB_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Image,
            position: robotPositionRef.current,
            rotation: robotRotationRef.current,
            collisionIndicator: collisionIndicator.current,
            imageCount: imageCount.current,
          }),
        });

        const data = await response.json();
        console.log("✅ YOLO Detection Results:", data);
        YOLOdetectObject.current = data.detections;
      } catch (error) {
        console.error("❌ Error sending image:", error);
      }

      isProcessing.current = false;
    };
  }

  return null;
});

export default RobotCamera;
