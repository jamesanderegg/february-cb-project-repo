import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";

import useStateCollector from "../hooks/useStateCollector";

const Buggy = forwardRef(({
  scale = 1,
  color,
  texturePath,
  visible = true,
  robotPositionRef,
  robotRotationRef,
  collisionIndicator,
  setObjectPositions,
  keysPressed,
  liveStateRef,
  recordingBufferRef,
  isRecordingActiveRef,
  frameResetRef,
  timerRef,
  currentActionRef,
  replayStepTriggerRef,
  controlMode,
  objectsInViewRef
}, ref) => {
  const buggyRef = useRef();
  const moveSpeed = 40;
  const rotationSpeed = 3;

  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;
  const lastResetTimeRef = useRef(0);


  const handleCollisionEnter = (event) => {
  const collidedObject = event.other.colliderObject;
  if (!collidedObject || ["RoomFloor", "HallFloor", "Plane"].includes(collidedObject.name)) return;

  const now = Date.now();
  if (now - lastResetTimeRef.current < 1500) return;
  lastResetTimeRef.current = now;

  // Instead of setting the ref here
  window.dispatchEvent(new CustomEvent("robotCollision", {
    detail: { collidedWith: collidedObject.name }
  }));
};



  useEffect(() => {
    if (!loadedScene) return;
    loadedScene.traverse((child) => {
      if (child.isMesh) {
        if (color) child.material.color.set(color);
        if (texture) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [loadedScene, color, texture]);

  useStateCollector({
    robotPositionRef,
    robotRotationRef,
    keysPressed,
    collisionIndicator,
    liveStateRef,
    recordingBufferRef,
    isRecordingActiveRef,
    frameResetRef,
    timerRef,
    objectsInViewRef
  });

  useFrame(() => {
    if (!buggyRef.current) return;

    const body = buggyRef.current;
    const isManual = controlMode === "manual";
    const isReplay = controlMode === "replay" && replayStepTriggerRef?.current === true;

    // ✅ REPLAY MODE — force exact position and rotation to prevent drift
    if (isReplay) {
      const [x, y, z] = robotPositionRef.current;
      const [qx, qy, qz, qw] = robotRotationRef.current;

      body.setTranslation({ x, y, z }, true);
      body.setRotation({ x: qx, y: qy, z: qz, w: qw }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Reset step trigger
      replayStepTriggerRef.current = false;
    }

    // ✅ MANUAL MODE — simulate physics-based movement
    if (isManual) {
      const activeKeys = currentActionRef?.current || [];

      let moveDirection = 0;
      let turnDirection = 0;

      if (activeKeys.includes("w")) moveDirection = moveSpeed;
      if (activeKeys.includes("s")) moveDirection = -moveSpeed;
      if (activeKeys.includes("a")) turnDirection = rotationSpeed;
      if (activeKeys.includes("d")) turnDirection = -rotationSpeed;

      // Rotation
      const currentRotation = new Quaternion().copy(body.rotation());
      if (turnDirection !== 0) {
        const turnQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), turnDirection * 0.05);
        currentRotation.multiply(turnQuaternion);
        body.setRotation(currentRotation, true);
      }

      // Movement
      let forward = new Vector3(0, 0, -moveDirection);
      forward.applyQuaternion(currentRotation);
      body.setLinvel({ x: forward.x, y: body.linvel().y, z: forward.z }, true);
    }

    // 🧠 Always update refs
    const { x, y, z } = body.translation();
    const rotationQuat = body.rotation();
    robotPositionRef.current = [x, y, z];
    robotRotationRef.current = [rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w];
  });




  useImperativeHandle(ref, () => ({
  resetBuggy: () => {
    if (buggyRef.current) {
      const body = buggyRef.current;
      body.setTranslation({ x: 7, y: 0.1, z: 15 }, true);
      const resetQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
      body.setRotation(resetQuaternion, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);

      if (collisionIndicator) {
        collisionIndicator.current = false;
      }
    }
  },
  getBody: () => buggyRef.current // 👈 expose the physics body
}));


  return (
    <RigidBody
      ref={buggyRef}
      type="dynamic"
      colliders="cuboid"
      position={[7, 0.1, 15]}
      rotation={[0, -Math.PI / 2, 0]}
      lockRotations={[true, false, true]}
      linearDamping={1000}
      angularDamping={1000}
      onCollisionEnter={handleCollisionEnter}
      name="buggy"
    >
      <group scale={scale} visible={visible}>
        <primitive object={loadedScene} />
      </group>
    </RigidBody>
  );
});

export default Buggy;
