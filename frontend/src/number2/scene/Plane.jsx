import React from "react";
import { RigidBody } from "@react-three/rapier";
import { DoubleSide, Box3, BoxHelper } from "three";
import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";

const Plane = ({ width = 50, height = 50, color = "darkgray", showHelper = false }) => {
  const ref = useRef();

  // Bounding Box Helper
  const { scene } = useThree();
  useEffect(() => {
    if (showHelper && ref.current) {
      const box = new BoxHelper(ref.current, 0xff0000);
      scene.add(box);
    }
  }, [showHelper, scene]);

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh ref={ref} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>
    </RigidBody>
  );
};

export default Plane;
