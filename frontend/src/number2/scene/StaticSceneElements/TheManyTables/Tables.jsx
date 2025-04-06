import React from "react";
import { Cylinder, Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

const Tables = ({ tableConfigs }) => {
  // Table dimensions
  const baseRadiusTop = 0.25;
  const baseRadiusBottom = 0.75;
  const baseHeight = 0.25;
  const standRadiusTop = 0.08;
  const standRadiusBottom = 0.2;
  const standHeight = 1;
  const topSize = [1.5, 0.05, 1.5];

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