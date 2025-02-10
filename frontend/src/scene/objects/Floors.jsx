import React from "react";
import { DoubleSide } from "three";

function Floors() {
    const floorConfigs = [
      { color: "blue", position: [0, 0, 0] },
      { color: "red", position: [0, 0, 12] },
      { color: "yellow", position: [15, 0, 12] },
      { color: "#cc5801", position: [10, 0, 2] },
      { color: "darkgreen", position: [5, 0, -10.25] },
    ];
  
    const hallways = [
      { geometry: [5, 17.5], position: [5, 0, 1] },
      { geometry: [10, 5], position: [7.5, 0, 12] },
    ];
  
    return (
      <group>
        {/* Room Floors */}
        {floorConfigs.map((config, index) => (
          <mesh key={index} rotation-x={Math.PI / 2} position={config.position}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial color={config.color} side={2} />
          </mesh>
        ))}
  
        {/* Hallways */}
        {hallways.map((hall, index) => (
          <mesh
            key={`hall-${index}`}
            rotation-x={Math.PI / 2}
            position={hall.position}
          >
            <planeGeometry args={hall.geometry} />
            <meshBasicMaterial color="brown" side={2} />
          </mesh>
        ))}
      </group>
    );
  }

export default Floors;
