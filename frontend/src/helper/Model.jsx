import React from "react";
import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { TextureLoader } from "three";

const MyModel = ({ filePath, scale = 1, position = [0, 0, 0], color, texturePath }) => {
  const { scene } = useGLTF(`models/${filePath}`);

  useEffect(() => {
    if (color) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set(color);
        }
      });
    }

    if (texturePath) {
      const textureLoader = new TextureLoader();
      textureLoader.load(texturePath, (texture) => {
        scene.traverse((child) => {
          if (child.isMesh) {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        });
      });
    }
  }, [scene, color, texturePath]);

  return <primitive object={scene} scale={scale} position={position} />;
};

export default MyModel;
