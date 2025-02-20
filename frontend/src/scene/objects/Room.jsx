import React, { useRef } from "react";
import { RigidBody } from "@react-three/rapier";

function Room({ config }) {
  const { material, positions, name } = config;

  return (
    <group>
      {/* Main Walls */}
      <RigidBody type="fixed" colliders="cuboid" position={[positions.wall1.x, positions.wall1.y, positions.wall1.z]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5, 5, 0.1]} /> 
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[positions.wall2.x, positions.wall2.y, positions.wall2.z]} rotation={[0, name === "green" ? Math.PI / 2 : 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5, 5, 0.1]} /> 
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[positions.wall3.x, positions.wall3.y, positions.wall3.z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5, 5, 0.1]} /> 
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
      </RigidBody>

      {/* Door Section */}
      <group position={[2.5, 0, 0]} rotation={[0, name === "green" ? Math.PI * 2 : Math.PI / 2, 0]}>
        <RigidBody type="fixed" colliders="cuboid" position={[positions.wall4.x, positions.wall4.y, positions.wall4.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 5, 0.1]} /> 
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid" position={[positions.wall5.x, positions.wall5.y, positions.wall5.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 2, 0.1]} /> 
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid" position={[positions.wall6.x, positions.wall6.y, positions.wall6.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 5, 0.1]} /> 
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
}

export default Room;
