import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TopDownCamera = forwardRef(({ robotPositionRef }, ref) => {
  const cameraRef = useRef();
  const helperRef = useRef();
  const { scene, gl } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(256, 256)); 
  const hudImageData = useRef(null);

  useEffect(() => {
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 100);
    cameraRef.current = camera;
    scene.add(camera);

    const helper = new THREE.CameraHelper(camera);
    helperRef.current = helper;
    scene.add(helper);

    return () => {
      scene.remove(camera);
      scene.remove(helper);
    };
  }, [scene]);

  useFrame(() => {
    if (robotPositionRef.current && cameraRef.current) {
      const [x, y, z] = robotPositionRef.current;

      // Position camera above the Buggy
      cameraRef.current.position.set(x, y + 20, z);
      cameraRef.current.lookAt(new THREE.Vector3(x, y, z));

      // Update helper visualization
      if (helperRef.current) helperRef.current.update();

      // Render to offscreen target
      gl.setRenderTarget(renderTarget.current);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);

      // Capture image from WebGL canvas
      const width = renderTarget.current.width;
      const height = renderTarget.current.height;
      const buffer = new Uint8Array(4 * width * height);
      gl.readRenderTargetPixels(renderTarget.current, 0, 0, width, height, buffer);

      // Create image data
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const imageData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        const srcRow = height - 1 - y; // Flip image
        const srcStart = srcRow * width * 4;
        const destStart = y * width * 4;
        imageData.data.set(buffer.subarray(srcStart, srcStart + width * 4), destStart);
      }

      ctx.putImageData(imageData, 0, 0);
      hudImageData.current = canvas.toDataURL("image/png"); // Store for HUD
    }
  });

  useImperativeHandle(ref, () => ({
    getHudImage: () => hudImageData.current, // ✅ Provide image to HUD
  }));

  return null;
});

export default TopDownCamera;
