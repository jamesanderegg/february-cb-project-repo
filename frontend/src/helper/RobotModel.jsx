import React, { useEffect, forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three";

const RobotModel = forwardRef(({
  filePath, 
  scale = 1, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  color, 
  texturePath,
  metallic = 1,         // 🔹 Control how metallic it is (1 = fully metallic)
  roughness = 0.2,      // 🔹 Control surface smoothness (0 = mirror-like, 1 = rough)
  visible = true,       // 🔹 Toggle visibility
  castShadow = true,    // 🔹 Enable/Disable shadow casting
  receiveShadow = true, // 🔹 Enable/Disable receiving shadows
}, ref) => {
  const { scene } = useGLTF(`models/${filePath}`);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;

        // Apply Material Properties
        if (child.material) {
          child.material.metalness = metallic; // Shiny metal effect
          child.material.roughness = roughness; // Control reflection sharpness

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
      }
    });
  }, [scene, color, texturePath, metallic, roughness, castShadow, receiveShadow]);

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
      ref={ref}
      visible={visible}
    />
  );
});

export default RobotModel;
