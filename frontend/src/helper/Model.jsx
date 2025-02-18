import React, { useEffect, forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useBox } from "@react-three/cannon"; // Fallback physics shape
import { BufferGeometry, Float32BufferAttribute, Vector3, TextureLoader, Box3 } from "three";
import { ConvexHull } from "three/examples/jsm/math/ConvexHull.js";

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
  const { scene } = useGLTF(`models/${filePath}`);
  const clonedScene = scene.clone();
  const localRef = useRef(null);
  const modelRef = ref || localRef;

  let vertices = [], indices = [];

  clonedScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;

      if (child.material) {
        child.material.metalness = metallic;
        child.material.roughness = roughness;
        if (color) child.material.color.set(color);
        if (texturePath) {
          new TextureLoader().load(texturePath, (texture) => {
            child.material.map = texture;
            child.material.needsUpdate = true;
          });
        }
      }

      const positionArray = child.geometry?.attributes?.position?.array;
      if (!positionArray) {
        console.warn("Mesh has no position attribute!", child);
        return;
      }

      for (let i = 0; i < positionArray.length; i += 3) {
        vertices.push(new Vector3(
          positionArray[i] * scale,  
          positionArray[i + 1] * scale,
          positionArray[i + 2] * scale
        ));
      }
    }
  });

  if (vertices.length === 0) {
    console.error(`No valid vertices found for ${filePath}. Skipping physics.`);
    return <group ref={modelRef} position={position} visible={visible} />;
  }

  // Try Convex Hull processing
  let useConvexShape = true;
  try {
    const hull = new ConvexHull().setFromPoints(vertices);
    hull.faces.forEach(face => {
      if (vertices[face.a] && vertices[face.b] && vertices[face.c]) {
        indices.push([face.a, face.b, face.c]); 
      }
    });
  } catch (e) {
    console.warn("Convex hull processing failed. Falling back to bounding box.");
    useConvexShape = false;
  }

  // Fallback: Use Bounding Box if Convex Hull fails
  let physicsShape, physicsApi;
  if (useConvexShape && indices.length > 0) {
    [physicsShape, physicsApi] = useConvexPolyhedron(() => ({
      mass: physicsProps.mass,
      args: [vertices.map(v => [v.x, v.y, v.z]), indices],
      position,
      rotation,
      linearDamping: physicsProps.linearDamping,
      angularDamping: physicsProps.angularDamping,
      type: physicsProps.mass === 0 ? "Static" : "Dynamic",
      velocity: [0, -5, 0], 
    }));
  } else {
    // Compute bounding box for fallback physics
    const boundingBox = new Box3().setFromPoints(vertices);
    const boxSize = boundingBox.getSize(new Vector3()).toArray();

    console.warn(`Using fallback box physics for ${filePath}.`);

    [physicsShape, physicsApi] = useBox(() => ({
      mass: physicsProps.mass,
      args: boxSize,
      position,
      rotation,
      linearDamping: physicsProps.linearDamping,
      angularDamping: physicsProps.angularDamping,
      type: physicsProps.mass === 0 ? "Static" : "Dynamic",
      velocity: [0, -5, 0],
    }));
  }

  useEffect(() => {
    if (physicsApi?.wakeUp) {
      physicsApi.wakeUp();
      physicsApi.velocity.set(0, -5, 0);
    } else {
      console.warn("Physics API is undefined!");
    }
  }, [physicsApi]);

  return (
    <group ref={physicsShape} position={position} visible={visible}>
      <primitive object={clonedScene} scale={scale} rotation={rotation} ref={modelRef} castShadow receiveShadow />
    </group>
  );
});

export default Model;
