import React from "react";
import { Cylinder, Box } from "@react-three/drei";

const FiberTable = ({
  position = [0, 0, 0],
  color = "#3d1010",
  baseRadiusTop = 0.25,
  baseRadiusBottom = 0.75,
  baseHeight = 0.25,
  standRadiusTop = 0.15,
  standRadiusBottom = 0,
  standHeight = 1,
  topSize = [1.4, 0.025, 1.4],
  key, 

}) => {
  return (
    <group position={position} key={key} castShadow receiveShadow>
      {/* Table Base */}
      <Cylinder
        args={[baseRadiusTop, baseRadiusBottom, baseHeight, 32]}
        position={[0, baseHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </Cylinder>

      {/* Table Stand */}
      <Cylinder
        args={[standRadiusTop, standRadiusBottom, standHeight, 32]}
        position={[0, baseHeight + standHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </Cylinder>

      {/* Table Top */}
      <Box
        args={topSize}
        position={[0, baseHeight + standHeight + topSize[1] / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </Box>
    </group>
  );
};

export default FiberTable;
