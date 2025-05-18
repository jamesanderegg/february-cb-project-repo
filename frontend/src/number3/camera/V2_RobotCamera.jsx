import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const RobotCamera = forwardRef((
  {
    robotRef,
    objectPositions,
    objectsInViewRef,
    modelPositionsRef,
    onCaptureImage,
    showFOV = true,
  },
  ref
) => {
  const cameraRef = useRef();
  const offscreenCanvasRef = useRef(document.createElement("canvas"));
  offscreenCanvasRef.current.width = 640;
  offscreenCanvasRef.current.height = 640;

  const fovHelperRef = useRef();
  const lastCaptureTimeRef = useRef(0);
  const captureInterval = 200; // Throttle to ~5 FPS

  const { gl, scene } = useThree();
  const renderTarget = useRef(new THREE.WebGLRenderTarget(640, 640, { stencilBuffer: false }));

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 10);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    cameraRef.current = camera;
    scene.add(camera);

    const fovMaterial = new THREE.LineBasicMaterial({ color: 0xffcc00 });
    const fovGeometry = new THREE.BufferGeometry();
    const fovVertices = new Float32Array(24 * 3); // 12 lines = 24 points
    fovGeometry.setAttribute("position", new THREE.BufferAttribute(fovVertices, 3));


    const fovLines = new THREE.LineSegments(fovGeometry, fovMaterial);
    fovHelperRef.current = fovLines;
    scene.add(fovLines);

    return () => {
      scene.remove(camera);
      scene.remove(fovLines);
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    getHudImage: () => offscreenCanvasRef.current.toDataURL("image/png"),
    getCanvas: () => offscreenCanvasRef.current, 
  }));


  useFrame(() => {
    if (robotRef.current?.getBody && cameraRef.current && modelPositionsRef.current) {
      const body = robotRef.current.getBody();
      const buggyPosition = new THREE.Vector3().copy(body.translation());
      buggyPosition.y += 2.5;
      const buggyRotation = new THREE.Quaternion().copy(body.rotation());

      const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 24);
      const lookDirection = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(pitch)
        .applyQuaternion(buggyRotation);

      cameraRef.current.position.copy(buggyPosition);
      const lookTarget = buggyPosition.clone().add(lookDirection.clone().multiplyScalar(5));
      cameraRef.current.lookAt(lookTarget);

      const projScreenMatrix = new THREE.Matrix4()
        .multiplyMatrices(
          cameraRef.current.projectionMatrix,
          new THREE.Matrix4().copy(cameraRef.current.matrixWorld).invert()
        );
      const frustum = new THREE.Frustum().setFromProjectionMatrix(projScreenMatrix);

      const visibleObjects = Object.entries(modelPositionsRef.current)
        .map(([id, data]) => {
          const originalObj = objectPositions.find(obj => obj.id === id) || { id };
          const positionVec = new THREE.Vector3(data.position[0], 1.25, data.position[2]);
          const cameraToObject = positionVec.clone().sub(cameraRef.current.position);
          const dotProduct = cameraToObject.dot(lookDirection);
          const isInFront = dotProduct > 0;
          const isVisible = isInFront && frustum.containsPoint(positionVec);
          if (!isVisible) return null;

          const projected = positionVec.clone().project(cameraRef.current);
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
        .sort((a, b) => a.ndcDistanceFromCenter - b.ndcDistanceFromCenter);

      objectsInViewRef.current = visibleObjects;

      // Render to render target
      gl.setRenderTarget(renderTarget.current);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);

      const width = renderTarget.current.width;
      const height = renderTarget.current.height;
      const buffer = new Uint8Array(4 * width * height);
      gl.readRenderTargetPixels(renderTarget.current, 0, 0, width, height, buffer);

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

      // ✅ Throttle HUD update
      const now = performance.now();
      if (now - lastCaptureTimeRef.current > captureInterval) {
        lastCaptureTimeRef.current = now;
        canvas.toBlob((blob) => {
          if (blob && onCaptureImage) {
            onCaptureImage(blob);
          }
        }, "image/png");
      }

      // Full frustum wireframe
      if (fovHelperRef.current) {
        fovHelperRef.current.visible = showFOV;
        const cam = cameraRef.current;
        const near = cam.near;
        const far = cam.far;
        const fov = (cam.fov * Math.PI) / 180;
        const aspect = 1;
        const heightNear = 2 * Math.tan(fov / 2) * near;
        const heightFar = 2 * Math.tan(fov / 2) * far;
        const widthNear = heightNear * aspect;
        const widthFar = heightFar * aspect;

        const camPos = cam.position.clone();

        // Near plane corners
        const nlt = new THREE.Vector3(-widthNear / 2, heightNear / 2, -near);
        const nrt = new THREE.Vector3(widthNear / 2, heightNear / 2, -near);
        const nlb = new THREE.Vector3(-widthNear / 2, -heightNear / 2, -near);
        const nrb = new THREE.Vector3(widthNear / 2, -heightNear / 2, -near);

        // Far plane corners
        const flt = new THREE.Vector3(-widthFar / 2, heightFar / 2, -far);
        const frt = new THREE.Vector3(widthFar / 2, heightFar / 2, -far);
        const flb = new THREE.Vector3(-widthFar / 2, -heightFar / 2, -far);
        const frb = new THREE.Vector3(widthFar / 2, -heightFar / 2, -far);

        // Transform all points to world space
        [nlt, nrt, nlb, nrb, flt, frt, flb, frb].forEach(p => p.applyMatrix4(cam.matrixWorld));

        const points = [
          [camPos, nlt], [camPos, nrt], [camPos, nlb], [camPos, nrb], // rays to near plane
          [nlt, flt], [nrt, frt], [nlb, flb], [nrb, frb],             // near to far
          [flt, frt], [frt, frb], [frb, flb], [flb, flt],             // far plane edges
        ];

        const pos = fovHelperRef.current.geometry.attributes.position.array;
        points.forEach(([start, end], i) => {
          start.toArray(pos, i * 6);
          end.toArray(pos, i * 6 + 3);
        });

        fovHelperRef.current.geometry.attributes.position.needsUpdate = true;
      }

    }
  });

  return null;
});

export default RobotCamera;
