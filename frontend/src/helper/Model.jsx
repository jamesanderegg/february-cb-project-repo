import React, { useEffect, forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useConvexPolyhedron } from "@react-three/cannon";
// import { Line } from "@react-three/drei";  // 🔹 Commented out for collision visualization
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { TextureLoader } from "three";

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
  showCollision = false // 🔹 No longer used
}, ref) => {
  const { scene } = useGLTF(`models/${filePath}`);

  let vertices = [];
  let indices = [];

  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;

      // Apply Material Properties
      if (child.material) {
        child.material.metalness = metallic;
        child.material.roughness = roughness;

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

      // Extract vertices and indices for Convex Polyhedron collision
      const positionArray = child.geometry.attributes.position.array;
      for (let i = 0; i < positionArray.length; i += 3) {
        vertices.push([
          positionArray[i] * scale,  
          positionArray[i + 1] * scale,
          positionArray[i + 2] * scale
        ]);
      }

      const indexArray = child.geometry.index.array;
      for (let i = 0; i < indexArray.length; i += 3) {
        // Ensure indices are counter-clockwise
        const v1 = new Vector3(...vertices[indexArray[i]]);
        const v2 = new Vector3(...vertices[indexArray[i + 1]]);
        const v3 = new Vector3(...vertices[indexArray[i + 2]]);

        const edge1 = new Vector3().subVectors(v2, v1);
        const edge2 = new Vector3().subVectors(v3, v1);
        const normal = new Vector3().crossVectors(edge1, edge2).normalize();

        // Check if normal points inward (should be outward)
        if (normal.dot(v1) < 0) {
          indices.push([indexArray[i], indexArray[i + 2], indexArray[i + 1]]); // Swap to make CCW
        } else {
          indices.push([indexArray[i], indexArray[i + 1], indexArray[i + 2]]);
        }
      }
    }
  });

  // Convert to Three.js BufferGeometry for better accuracy
  const collisionGeometry = new BufferGeometry();
  collisionGeometry.setAttribute('position', new Float32BufferAttribute(vertices.flat(), 3));
  collisionGeometry.setIndex(indices.flat());

  // Create physics body using ConvexPolyhedron for accurate shape collision
  const [modelRef, api] = useConvexPolyhedron(() => ({
    mass: physicsProps.mass,
    args: [vertices, indices],
    position: position,
    rotation: rotation,
    linearDamping: physicsProps.linearDamping,
    angularDamping: physicsProps.angularDamping,
    type: physicsProps.mass === 0 ? "Static" : "Dynamic",
    velocity: [0, -2, 0], // Ensures immediate fall
  }));
  
  useEffect(() => {
    api.wakeUp(); // Forces physics activation
  }, []);

  return (
    <group ref={modelRef} position={position} visible={visible}>
      {/* Original Model */}
      <primitive
        object={scene}
        scale={scale} 
        rotation={rotation}
        ref={(node) => {
          modelRef.current = node;
          if (ref) ref.current = node;
        }}
        castShadow
        receiveShadow
      />

      {/* 🔹 Collision Box Visualization - Removed */}
      {/* {showCollision && (
        <Line
          points={vertices.map(v => [v[0], v[1], v[2]])}
          color="red"
          lineWidth={2}
        />
      )} */}
    </group>
  );
});

export default Model;
