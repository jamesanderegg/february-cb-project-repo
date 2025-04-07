import React, { useEffect, useRef, useMemo, forwardRef, useState } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Color } from "three";
import { useThree, useFrame } from "@react-three/fiber";

const Model = forwardRef(({
  filePath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  texturePath,
  metallic = 1,
  roughness = 0.2,
  visible = true,
  castShadow = true,
  receiveShadow = true,
  physicsProps = { mass: 1, linearDamping: 0.5, angularDamping: 0.5 },
  collider,
  onPositionUpdate
}, ref) => {
  const { scene } = useThree();
  const rigidBodyRef = useRef();
  
  // Forward the ref to the RigidBody
  React.useImperativeHandle(ref, () => rigidBodyRef.current);

  // Load GLTF Model
  const { scene: loadedScene } = useGLTF(filePath);
  const [isReady, setIsReady] = useState(false);
  // Memoize Cloned Scene to Prevent Re-Cloning on Every Render
  const clonedScene = useMemo(() => loadedScene.clone(), [loadedScene]);

  // Preload texture
  const texture = texturePath ? useTexture(texturePath) : null;

  // Track the current position and rotation for updates
  useFrame(() => {
    if (rigidBodyRef.current && onPositionUpdate) {
      const currentPosition = rigidBodyRef.current.translation();
      const currentRotation = rigidBodyRef.current.rotation();
      
      // Convert to arrays for consistency
      const positionArray = [currentPosition.x, currentPosition.y, currentPosition.z];
      const rotationArray = [currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w];
      
      // Call the callback with current position and rotation
      onPositionUpdate(positionArray, rotationArray);
    }
  });

  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;

        if (color) child.material.color = new Color(color);
        if (texture) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }

        child.material.metalness = metallic;
        child.material.roughness = roughness;
      }
    });

    setIsReady(true);
  }, [clonedScene, color, metallic, roughness, castShadow, receiveShadow, texture]);

  return isReady ? (
    <RigidBody
      ref={rigidBodyRef}
      type={physicsProps.mass === 0 ? "fixed" : "dynamic"}
      colliders={collider}
      mass={physicsProps.mass}
      linearDamping={physicsProps.linearDamping}
      angularDamping={physicsProps.angularDamping}
      friction={physicsProps.friction || 0.7}
      restitution={physicsProps.restitution || 0}
      position={position}
      rotation={rotation}
    >
      <primitive
        object={clonedScene}
        scale={scale}
        visible={visible}
      />
    </RigidBody>
  ) : null;
});

export default Model;