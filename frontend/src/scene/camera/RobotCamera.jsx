import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Robot Camera Component
const RobotCamera = forwardRef(({ robotRef, onCaptureImage }, ref) => {
  const cameraRef = useRef();  // Robot camera reference
  const helperRef = useRef();

  const { gl, scene } = useThree();
  const renderTarget = new THREE.WebGLRenderTarget(1024, 1024, { stencilBuffer: false }); // Offscreen framebuffer

  useEffect(() => {
    // Create a custom camera for the robot
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 15);  // This is the robot camera (fov, aspect, near, far)
    cameraRef.current = camera;
    scene.add(camera);  // Add the camera to the scene for debugging with the helper

    // Debugging helper to visualize the camera view (remove if not needed)
    const helper = new THREE.CameraHelper(camera);
    scene.add(helper);
    helperRef.current = helper;

    return () => {
      scene.remove(camera); // Clean up the camera on unmount
      if (helperRef.current) {
        scene.remove(helperRef.current); // Clean up the helper
      }
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    captureImage: async () => {
      try {
        gl.autoClear = false;  // Prevent clearing before render
        gl.setRenderTarget(renderTarget);  // Set the render target to the robot camera's framebuffer
        gl.render(scene, cameraRef.current);  // Render the scene using the robot camera
        gl.setRenderTarget(null);  // Reset the render target to the default framebuffer
        gl.autoClear = true;  // Restore autoClear to true

        // Capture the image from the offscreen framebuffer
        const buffer = new Uint8Array(4 * renderTarget.width * renderTarget.height); // Create a buffer to store image data
        gl.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, buffer);

        // Create an image from the buffer
        const imageData = new ImageData(new Uint8ClampedArray(buffer.buffer), renderTarget.width, renderTarget.height);

        // Flip the image data vertically (inverting the Y coordinates of the pixels)
        const flippedData = new Uint8ClampedArray(imageData.data.length);
        for (let i = 0; i < renderTarget.height; i++) {
          for (let j = 0; j < renderTarget.width; j++) {
            const sourceIndex = (i * renderTarget.width + j) * 4;
            const destIndex = ((renderTarget.height - i - 1) * renderTarget.width + j) * 4;
            flippedData[destIndex] = imageData.data[sourceIndex];
            flippedData[destIndex + 1] = imageData.data[sourceIndex + 1];
            flippedData[destIndex + 2] = imageData.data[sourceIndex + 2];
            flippedData[destIndex + 3] = imageData.data[sourceIndex + 3];
          }
        }

        // Create a new image from the flipped data
        const flippedImageData = new ImageData(flippedData, renderTarget.width, renderTarget.height);
        const canvas = document.createElement('canvas');
        canvas.width = renderTarget.width;
        canvas.height = renderTarget.height;
        const ctx = canvas.getContext('2d');

        // Draw the flipped image onto the canvas
        ctx.putImageData(flippedImageData, 0, 0);

        // Convert to base64
        const base64Image = canvas.toDataURL("image/png");
        console.log("Captured image from offscreen render target:", base64Image);

        // Send the captured image to the backend
        if (onCaptureImage) {
          onCaptureImage(base64Image);  // Trigger the callback to send image to backend
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
      headPosition.y += 2.5;  // Adjust for robot's camera height

      const robotRotation = robotRef.current.rotation.y;  // Get robot's rotation
      const lookDirection = new THREE.Vector3(
        -Math.sin(robotRotation),
        0,
        -Math.cos(robotRotation)
      );

      // Update the robot camera's position to the robot's head
      cameraRef.current.position.copy(headPosition);
      const lookTarget = headPosition.clone().add(lookDirection.multiplyScalar(5));
      lookTarget.y -= 1; // Adjust the look direction in the y-axis
      cameraRef.current.lookAt(lookTarget);

      if (helperRef.current) {
        helperRef.current.update();  // Update camera helper for visualization
      }
    }
  });

  return null;  // No need to render JSX for the camera, it's added to the scene programmatically
});

export default RobotCamera;
