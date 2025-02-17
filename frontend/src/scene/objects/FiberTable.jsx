import React from "react";
import { Cylinder, Box, Line } from "@react-three/drei";
import { useCompoundBody } from "@react-three/cannon";

const FiberTable = ({
  position = [0, 0, 0],
  color = "#3d1010",
  baseRadiusTop = 0.25,
  baseRadiusBottom = 0.75,
  baseHeight = 0.25,
  standRadiusTop = 0.15,
  standRadiusBottom = 0,
  standHeight = 1,
  topSize = [1.4, 0.05, 1.4],  // 🔹 Keeps tabletop thickness correct
  physicsProps = { mass: 0 },  // Default: Static Table
  showCollision = true // 🔹 Toggle collision box visibility
}) => {
  
  // Create a single physics body for the entire table
  const [tableRef] = useCompoundBody(() => ({
    mass: physicsProps.mass,
    position: position,  // 🔹 Keeps your table positions unchanged
    type: physicsProps.mass === 0 ? "Static" : "Dynamic",
    shapes: [
      {
        type: "Cylinder",
        args: [baseRadiusTop, baseRadiusBottom, baseHeight, 32],
        position: [0, baseHeight / 2, 0]  // Base position
      },
      {
        type: "Cylinder",
        args: [standRadiusTop, standRadiusBottom, standHeight, 32],
        position: [0, baseHeight + standHeight / 2, 0]  // Stand position
      },
      {
        type: "Box",
        args: [topSize[0], topSize[1], topSize[2]],  
        position: [0, baseHeight + standHeight + topSize[1] / 2, 0]  // 🔹 Keeps tabletop in exact position
      }
    ]
  }));

  return (
    <group ref={tableRef} position={position} castShadow receiveShadow>
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

      {/* 🔹 Collision Box Visualization */}
      {showCollision && (
        <>
          {/* Collision Box for Base */}
          <Cylinder
            args={[baseRadiusTop, baseRadiusBottom, baseHeight, 32]}
            position={[0, baseHeight / 2, 0]}
          >
            <meshBasicMaterial color="red" wireframe />
          </Cylinder>

          {/* Collision Box for Stand */}
          <Cylinder
            args={[standRadiusTop, standRadiusBottom, standHeight, 32]}
            position={[0, baseHeight + standHeight / 2, 0]}
          >
            <meshBasicMaterial color="red" wireframe />
          </Cylinder>

          {/* Collision Box for Table Top */}
          <Box
            args={topSize}
            position={[0, baseHeight + standHeight + topSize[1] / 2, 0]}
          >
            <meshBasicMaterial color="red" wireframe />
          </Box>
        </>
      )}
    </group>
  );
};

export default FiberTable;
