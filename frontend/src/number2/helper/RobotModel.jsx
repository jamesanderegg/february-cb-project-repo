import React, { useEffect, useRef, useMemo, forwardRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Color } from "three";

const RobotModel = forwardRef(({
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
  const localRef = useRef(null); // Local reference for physics body
  const { scene: loadedScene } = useGLTF(`models/${filePath}`);

  const clonedScene = useMemo(() => loadedScene.clone(), [loadedScene]);
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
  }, [clonedScene, color, metallic, roughness, texture]);

  return (
    <RigidBody
      ref={(node) => {
        localRef.current = node;
        if (ref) ref.current = node;
      }}
      type="dynamic"
      colliders="cuboid"
      mass={physicsProps.mass}
      linearDamping={physicsProps.linearDamping}
      angularDamping={physicsProps.angularDamping}
      lockRotations={[true, false, true]} // Keep robot upright
    >
      <primitive object={clonedScene} scale={scale} position={position} rotation={rotation} visible={visible} />
    </RigidBody>
  );
});

export default RobotModel;
