import React, { useRef } from "react";
import { RigidBody } from "@react-three/rapier";

const OuterWalls = () => {
    const wallColor = "#CCCCFF" // periwinkle
    const wallHeight = 15
    
    return (
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          {/* Left Wall */}
          <mesh position={[-16, wallHeight/2, 4]}>
            <boxGeometry args={[0.1, wallHeight, 40]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          {/* Right Wall */}
          <mesh position={[25, wallHeight/2, -2]}>
            <boxGeometry args={[0.1, wallHeight, 40]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </RigidBody>
    
        <RigidBody type="fixed" colliders="cuboid">
          {/* Back Wall */}
          <mesh position={[7.5, wallHeight/2, -22]}>
            <boxGeometry args={[35, wallHeight, 0.1]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </RigidBody>
  
        <RigidBody type="fixed" colliders="cuboid">
          {/* Front Wall */}
          <mesh position={[1.5, wallHeight/2, 24]}>
            <boxGeometry args={[35, wallHeight, 0.1]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          {/* Back Right Diagonal Wall */}
          <group rotation={[0, -Math.PI/4, 0]} position={[-13, wallHeight/2, -19]}>
            <mesh>
              <boxGeometry args={[0.1, wallHeight, 8.5]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          </group>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          {/* Front Left Diagonal Wall */}
          <group rotation={[0, -Math.PI/4, 0]} position={[22, wallHeight/2, 21]}>
            <mesh>
              <boxGeometry args={[0.1, wallHeight, 8.5]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          </group>
        </RigidBody>
      </group>
    )
  }
  
  export default OuterWalls;