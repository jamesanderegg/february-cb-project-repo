import React from "react";
import { RigidBody } from "@react-three/rapier";
import { DoubleSide } from "three";
import { useRef } from "react";

const Plane = ({ width = 50, height = 50, color = "darkgray" }) => {
  const ref = useRef();

  return (
    <RigidBody type="fixed" colliders="cuboid" name="Plane" >
      <mesh ref={ref} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={DoubleSide} showGrid />
      </mesh>
    </RigidBody>
  );
};

export default Plane;
