import React, { useEffect, useRef, useMemo, forwardRef, useState } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Color, Quaternion } from "three";
import { useThree, useFrame } from "@react-three/fiber";

const Model = forwardRef(({
  filePath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0, 1], // now clearly treated as quaternion
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
  React.useImperativeHandle(ref, () => rigidBodyRef.current);

  const { scene: loadedScene } = useGLTF(filePath);
  const [isReady, setIsReady] = useState(false);
  const clonedScene = useMemo(() => loadedScene.clone(), [loadedScene]);
  const texture = texturePath ? useTexture(texturePath) : null;

  // Track position updates
  useFrame(() => {
    if (rigidBodyRef.current && onPositionUpdate) {
      const pos = rigidBodyRef.current.translation();
      const rot = rigidBodyRef.current.rotation();
      onPositionUpdate([pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z, rot.w]);
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

  // 🔁 After mount, apply quaternion
  useEffect(() => {
    if (rigidBodyRef.current) {
      const q = new Quaternion(...rotation);
      rigidBodyRef.current.setRotation(q, true);
    }
  }, [rotation]);

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
    >
      <primitive object={clonedScene} scale={scale} visible={visible} />
    </RigidBody>
  ) : null;
});

export default Model;
