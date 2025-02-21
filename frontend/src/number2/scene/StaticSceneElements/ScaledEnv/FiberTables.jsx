import React from "react";
import { Cylinder, Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

const Tables = () => {
  // Table configurations - each entry contains color and position
  const tableConfigs = [
    // Blue room tables (3)
    { color: '#aa875c', position: [-3, 0, 0] },
    { color: '#ad6d68', position: [3, 0, 3] },
    { color: '#4a0100', position: [0, 0, -3] },

    // Red room tables (3)
    { color: '#c2a293', position: [-3, 0, 24] },
    { color: '#aa875c', position: [1, 0, 27] },
    { color: '#4a0100', position: [0, 0, 21] },

    // Yellow room tables (3)
    { color: '#4a0100', position: [34, 0, 28] },
    { color: '#ad6d68', position: [34, 0, 26] },
    { color: '#cc5801', position: [30, 0, 20] },

    // Orange room tables (3)
    { color: '#4a0100', position: [16, 0, 7] },
    { color: '#4a0100', position: [23, 0, 7] },
    { color: '#4a0100', position: [23, 0, 0.5] },

    // Green room tables (3)
    { color: '#8a3244', position: [7, 0, -18] },
    { color: '#aa875c', position: [11, 0, -20.5] },
    { color: '#4a0100', position: [7, 0, -23.5] },

    // Outside tables (3)
    { color: 'red', position: [14, 0, 8] },
    { color: 'blue', position: [24, 0, 20] },
    { color: 'yellow', position: [6, 0, -8] }
  ];

  // Table dimensions
  const baseRadiusTop = 0.25;
  const baseRadiusBottom = 0.75;
  const baseHeight = 0.25;
  const standRadiusTop = 0.08;
  const standRadiusBottom = 0.2;
  const standHeight = 1;
  const topSize = [1.4, 0.05, 1.4];

  return (
    <>
      {tableConfigs.map((config, index) => (
        <RigidBody
          key={index}
          type="fixed"
          position={config.position}
          mass={0}
          colliders="hull"
        >
          <group castShadow receiveShadow>
            {/* Table Base */}
            <Cylinder
              args={[baseRadiusTop, baseRadiusBottom, baseHeight, 32]}
              position={[0, baseHeight / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={config.color} />
            </Cylinder>

            {/* Table Stand */}
            <Cylinder
              args={[standRadiusTop, standRadiusBottom, standHeight, 32]}
              position={[0, baseHeight + standHeight / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={config.color} />
            </Cylinder>

            {/* Table Top */}
            <Box
              args={topSize}
              position={[0, baseHeight + standHeight + topSize[1] / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={config.color} />
            </Box>
          </group>
        </RigidBody>
      ))}
    </>
  );
};

export default Tables;