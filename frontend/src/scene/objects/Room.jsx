import React from "react";
import { useBox } from "@react-three/cannon";

function Room({ config }) {
    const { material, positions, name } = config;
  
    return (
      <group>
        {/* Main Walls */}
        <mesh
          position={[positions.wall1.x, positions.wall1.y, positions.wall1.z]}
          castShadow
          receiveShadow
          ref={useBox(() => ({
            args: [5, 5, 0.1], 
            position: [positions.wall1.x, positions.wall1.y, positions.wall1.z],
            type: "Static",
          }))[0]}
        >
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
  
        <mesh
          position={[positions.wall2.x, positions.wall2.y, positions.wall2.z]}
          rotation={[0, name === "green" ? Math.PI / 2 : 0, 0]}
          castShadow
          receiveShadow
          ref={useBox(() => ({
            args: [5, 5, 0.1], 
            position: [positions.wall2.x, positions.wall2.y, positions.wall2.z],
            rotation: [0, name === "green" ? Math.PI / 2 : 0, 0],
            type: "Static",
          }))[0]}
        >
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
  
        <mesh
          position={[positions.wall3.x, positions.wall3.y, positions.wall3.z]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
          ref={useBox(() => ({
            args: [5, 5, 0.1], 
            position: [positions.wall3.x, positions.wall3.y, positions.wall3.z],
            rotation: [0, Math.PI / 2, 0],
            type: "Static",
          }))[0]}
        >
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color={material.color} side={2} />
        </mesh>
  
        {/* Door Section */}
        <group
          position={[2.5, 0, 0]}
          rotation={[0, name === "green" ? Math.PI * 2 : Math.PI / 2, 0]}
        >
          <mesh
            position={[positions.wall4.x, positions.wall4.y, positions.wall4.z]}
            castShadow
            receiveShadow
            ref={useBox(() => ({
              args: [2, 5, 0.1], 
              position: [positions.wall4.x, positions.wall4.y, positions.wall4.z],
              type: "Static",
            }))[0]}
          >
            <planeGeometry args={[2, 5]} />
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
  
          <mesh
            position={[positions.wall5.x, positions.wall5.y, positions.wall5.z]}
            castShadow
            receiveShadow
            ref={useBox(() => ({
              args: [1, 2, 0.1], 
              position: [positions.wall5.x, positions.wall5.y, positions.wall5.z],
              type: "Static",
            }))[0]}
          >
            <planeGeometry args={[1, 2]} />
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
  
          <mesh
            position={[positions.wall6.x, positions.wall6.y, positions.wall6.z]}
            castShadow
            receiveShadow
            ref={useBox(() => ({
              args: [2, 5, 0.1], 
              position: [positions.wall6.x, positions.wall6.y, positions.wall6.z],
              type: "Static",
            }))[0]}
          >
            <planeGeometry args={[2, 5]} />
            <meshStandardMaterial color={material.color} side={2} />
          </mesh>
        </group>
      </group>
    );
}

export default Room;
