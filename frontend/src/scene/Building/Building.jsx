import React from "react";
import { useMemo } from "react";

const Floor = ({ position, color, size }) => {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} side={2} />
    </mesh>
  );
};

const Wall = ({ position, rotation, color, size }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} side={2} />
    </mesh>
  );
};

const DoorWall = ({ position, rotation, color }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-1.5, 2.5, 0]}>
        <planeGeometry args={[2, 5]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <planeGeometry args={[1, 2]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      <mesh position={[1.5, 2.5, 0]}>
        <planeGeometry args={[2, 5]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
    </group>
  );
};

const Building = () => {
  const walls = useMemo(
    () => [
      { position: [0, 2.5, 2.5], rotation: [0, 0, 0], color: "blue" },
      { position: [0, 2.5, -2.5], rotation: [0, 0, 0], color: "blue" },
      { position: [-2.5, 2.5, 0], rotation: [0, Math.PI / 2, 0], color: "blue" },
    ],
    []
  );

  return (
    <>
      <Floor position={[0, 0, 0]} color="blue" size={[5, 5]} />
      <Floor position={[0, 0, 12]} color="red" size={[5, 5]} />
      <Floor position={[15, 0, 12]} color="yellow" size={[5, 5]} />
      <Floor position={[10, 0, 2]} color="orange" size={[5, 5]} />
      <Floor position={[5, 0, -10]} color="green" size={[5, 5]} />
      <Floor position={[5, 0, 1]} color="brown" size={[5, 17.5]} />
      <Floor position={[7.5, 0, 12]} color="brown" size={[10, 5]} />

      {walls.map((wall, index) => (
        <Wall key={index} {...wall} size={[5, 5]} />
      ))}

      <DoorWall position={[2.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="blue" />
    </>
  );
};

export default Building;