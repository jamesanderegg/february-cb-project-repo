import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera";

const Buggy = forwardRef(({ 
  scale = 1,
  color,
  texturePath,
  visible = true,
  robotCameraRef,
  YOLOdetectObject,
  robotPositionRef,
  robotRotationRef,
  collisionIndicator,
  objectPositions,
  setObjectPositions,
  COLAB_API_URL,
  objectsInViewRef
}, ref) => {
  const buggyRef = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 4;

  // Load GLTF Model & Texture
  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;

  const handleCollisionEnter = (event) => {
    const collidedObject = event.other.colliderObject;
    if (!collidedObject) return;
    if (["RoomFloor", "HallFloor", "Plane"].includes(collidedObject.name)) return;
    collisionIndicator.current = true;
    setObjectPositions([]);
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

  useEffect(() => {
    const handleKey = (event, isPressed) => {
      keysPressed.current[event.key] = isPressed;
    };

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));

    return () => {
      window.removeEventListener("keydown", (e) => handleKey(e, true));
      window.removeEventListener("keyup", (e) => handleKey(e, false));
    };
  }, []);

  useFrame(() => {
    if (!buggyRef.current) return;
    const body = buggyRef.current;
    let moveDirection = 0;
    let turnDirection = 0;
  
    if (keysPressed.current["w"]) moveDirection = moveSpeed;
    if (keysPressed.current["s"]) moveDirection = -moveSpeed;
    if (keysPressed.current["a"]) turnDirection = rotationSpeed;
    if (keysPressed.current["d"]) turnDirection = -rotationSpeed;
  
    const currentRotation = new Quaternion().copy(body.rotation());
    if (turnDirection !== 0) {
      const turnQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), turnDirection * 0.05);
      currentRotation.multiply(turnQuaternion);
      body.setRotation(currentRotation, true);
    }
  
    let forward = new Vector3(0, 0, -moveDirection);
    forward.applyQuaternion(currentRotation);
    body.setLinvel({ x: forward.x, y: body.linvel().y, z: forward.z }, true);
  
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
      }
    }
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

      <RobotCamera
        robotRef={buggyRef}
        ref={robotCameraRef}
        YOLOdetectObject={YOLOdetectObject}
        robotPositionRef={robotPositionRef}
        robotRotationRef={robotRotationRef}
        collisionIndicator={collisionIndicator}
        objectPositions={objectPositions}
        COLAB_API_URL={COLAB_API_URL}
        objectsInViewRef={objectsInViewRef}
      />
    </RigidBody>
  );
});

export default Buggy;