import React, { useEffect, useRef, useMemo, forwardRef, useState } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Color } from "three";
import { useThree } from "@react-three/fiber";

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
  physicsProps = { mass: 1, linearDamping: 0.5, angularDamping: 0.5 }
}, ref) => {
  const { scene } = useThree();

  // Load GLTF Model
  const { scene: loadedScene } = useGLTF(filePath);
  const [isReady, setIsReady] = useState(false);
  // Memoize Cloned Scene to Prevent Re-Cloning on Every Render
  const clonedScene = useMemo(() => loadedScene.clone(), [loadedScene]);

  // Preload texture
  const texture = texturePath ? useTexture(texturePath) : null;

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
  }, [clonedScene, color, metallic, roughness, scene, texture]);

  return isReady ? (
    <RigidBody
      ref={ref} // Now Model supports refs correctly
      type={physicsProps.mass === 0 ? "fixed" : "dynamic"}
      colliders="cuboid"
      mass={physicsProps.mass}
      linearDamping={physicsProps.linearDamping}
      angularDamping={physicsProps.angularDamping}
    >
      <primitive
        object={clonedScene}
        scale={scale}
        position={position}
        rotation={rotation}
        visible={visible}
      />
    </RigidBody>
  ) : null;
});

export default Model;
