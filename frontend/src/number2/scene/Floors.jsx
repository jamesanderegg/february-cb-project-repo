import React from "react";
import { RigidBody } from "@react-three/rapier";

function Floors() {
  const floorConfigs = [
    { color: "blue", position: [0, 0.01, 0] }, // Lifted slightly
    { color: "red", position: [0, 0.01, 12] },
    { color: "yellow", position: [15, 0.01, 12] },
    { color: "#cc5801", position: [10, 0.01, 2] },
    { color: "darkgreen", position: [5, 0.01, -10.25] },
  ];

  const hallways = [
    { geometry: [5, 17.5], position: [5, 0.01, 1] }, // Lifted slightly
    { geometry: [10, 5], position: [7.5, 0.01, 12] },
  ];

  return (
    <group>
      {/* Room Floors */}
      {floorConfigs.map((config, index) => (
        <RigidBody key={index} type="fixed" position={config.position}>
          <mesh rotation-x={Math.PI / 2}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial color={config.color} side={2} />
          </mesh>
        </RigidBody>
      ))}

      {/* Hallways */}
      {hallways.map((hall, index) => (
        <RigidBody key={`hall-${index}`} type="fixed" position={hall.position}>
          <mesh rotation-x={Math.PI / 2}>
            <planeGeometry args={hall.geometry} />
            <meshBasicMaterial color="brown" side={2} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

export default Floors;
