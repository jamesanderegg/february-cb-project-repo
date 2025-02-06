import React from "react";
import { DoubleSide } from "three";

const Plane = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    {/* Geometry */}
    <planeGeometry args={[20, 20]} />
    {/* Material */}
    <meshStandardMaterial color="lightgray" side={DoubleSide} />
  </mesh>
);

export default Plane;
