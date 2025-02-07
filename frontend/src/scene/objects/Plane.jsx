import React from "react";
import { DoubleSide } from "three";

const Plane = () => (
  <mesh position={[0, -.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    {/* Geometry */}
    <planeGeometry args={[50, 50]} />
    {/* Material */}
    <meshStandardMaterial color="lightgray" side={DoubleSide} />
  </mesh>
);

export default Plane;
