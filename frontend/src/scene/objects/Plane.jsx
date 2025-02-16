import React from "react";
import { usePlane } from "@react-three/cannon";
import { DoubleSide } from "three";

const Plane = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.01, 0],
    type: "Static",
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="darkgray" side={DoubleSide} />
    </mesh>
  );
};

export default Plane;
