import React from "react";
import { usePlane } from "@react-three/cannon";

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
        {floorConfigs.map((config, index) => {
          const [ref] = usePlane(() => ({
            rotation: [-Math.PI / 2, 0, 0], // Keeps the floor flat
            position: config.position,
            type: "Static",
          }));

          return (
            <mesh key={index} ref={ref} rotation-x={Math.PI / 2} position={config.position}>
              <planeGeometry args={[5, 5]} />
              <meshBasicMaterial color={config.color} side={2} />
            </mesh>
          );
        })}
  
        {/* Hallways */}
        {hallways.map((hall, index) => {
          const [ref] = usePlane(() => ({
            rotation: [-Math.PI / 2, 0, 0], // Keeps hallways flat
            position: hall.position,
            type: "Static",
          }));

          return (
            <mesh key={`hall-${index}`} ref={ref} rotation-x={Math.PI / 2} position={hall.position}>
              <planeGeometry args={hall.geometry} />
              <meshBasicMaterial color="brown" side={2} />
            </mesh>
          );
        })}
      </group>
    );
}

export default Floors;
