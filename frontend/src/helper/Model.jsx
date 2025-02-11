import React, { useEffect, forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three";

const Model = forwardRef(({ filePath, scale = 1, position = [0, 0, 0], color, texturePath }, ref) => {
  const { scene } = useGLTF(`models/${filePath}`);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;  // ✅ Ensure the robot casts a shadow
        child.receiveShadow = true; // ✅ (Optional) If it should receive shadows

        if (color) {
          child.material.color.set(color);
        }

        if (texturePath) {
          const textureLoader = new TextureLoader();
          textureLoader.load(texturePath, (texture) => {
            child.material.map = texture;
            child.material.needsUpdate = true;
          });
        }
      }
    });
  }, [scene, color, texturePath]);

  return <primitive object={scene} scale={scale} position={position} ref={ref} />;
});

export default Model;
