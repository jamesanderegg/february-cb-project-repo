import React, { useEffect, useRef, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { BoxHelper, Color } from "three";
import { useThree, useFrame } from "@react-three/fiber";

const Model = ({
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
  showHelper = false,
  physicsProps = { mass: 1, linearDamping: 0.5, angularDamping: 0.5 }
}) => {
  const ref = useRef(null); // RigidBody reference
  const helperRef = useRef(null); // BoxHelper reference
  const { scene } = useThree();

  // Load GLTF Model
  const { scene: loadedScene } = useGLTF(filePath);

  // Memoize Cloned Scene to Prevent Re-Cloning on Every Render
  const clonedScene = useMemo(() => loadedScene.clone(), [loadedScene]);

  // Preload texture outside of useEffect
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

    // Attach Bounding Box Helper to the actual RigidBody
    if (showHelper && ref.current) {
      const firstMesh = clonedScene.children.find((child) => child.isMesh);
      if (firstMesh) {
        const boxHelper = new BoxHelper(firstMesh, 0xff0000);
        scene.add(boxHelper);
        helperRef.current = boxHelper;
      }
    }
  }, [clonedScene, color, metallic, roughness, showHelper, scene, texture]);

  // Ensure Bounding Box follows physics-driven motion
  useFrame(() => {
    if (helperRef.current && ref.current) {
      // Sync helper with RigidBody physics position
      const bodyPosition = ref.current.translation(); // Get physics-based position
      const bodyRotation = ref.current.rotation(); // Get physics-based rotation

      helperRef.current.position.copy(bodyPosition); // Sync position
      helperRef.current.rotation.copy(bodyRotation); // Sync rotation
      helperRef.current.updateMatrixWorld(true); // Force update
    }
  });

  return (
    <RigidBody
      ref={ref}
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
  );
};

export default Model;
