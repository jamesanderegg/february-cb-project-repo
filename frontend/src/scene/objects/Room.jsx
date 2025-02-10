import React from "react";

function Room({ config }) {
    const { material, positions, name } = config;
  
    return (
      <group>
        {/* Main Walls */}
        <mesh
          position={[positions.wall1.x, positions.wall1.y, positions.wall1.z]}
        >
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial color={material.color} side={2} />
        </mesh>
  
        <mesh
          position={[positions.wall2.x, positions.wall2.y, positions.wall2.z]}
          rotation-y={name === "green" ? Math.PI / 2 : 0}
        >
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial color={material.color} side={2} />
        </mesh>
  
        <mesh
          position={[positions.wall3.x, positions.wall3.y, positions.wall3.z]}
          rotation-y={Math.PI / 2}
        >
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial color={material.color} side={2} />
        </mesh>
  
        {/* Door Section */}
        <group
          position={[2.5, 0, 0]}
          rotation-y={name === "green" ? Math.PI * 2 : Math.PI / 2}
        >
          <mesh
            position={[positions.wall4.x, positions.wall4.y, positions.wall4.z]}
          >
            <planeGeometry args={[2, 5]} />
            <meshBasicMaterial color={material.color} side={2} />
          </mesh>
  
          <mesh
            position={[positions.wall5.x, positions.wall5.y, positions.wall5.z]}
          >
            <planeGeometry args={[1, 2]} />
            <meshBasicMaterial color={material.color} side={2} />
          </mesh>
  
          <mesh
            position={[positions.wall6.x, positions.wall6.y, positions.wall6.z]}
          >
            <planeGeometry args={[2, 5]} />
            <meshBasicMaterial color={material.color} side={2} />
          </mesh>
        </group>
      </group>
    );
  }
  export default Room;