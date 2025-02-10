// import React from "react";
// import { Canvas } from "@react-three/fiber";
// import Cube from "./objects/Cube";
// import Plane from "./objects/Plane";
// import OrbitControls from "./controls/OrbitControls";
// import AmbientLight from "./lights/AmbientLight";
// import DirectionalLight from "./lights/DirectionalLight";
// import Building from "./Building/Building";
// import Model from "../helper/Model";
// import PrimaryCamera from "./camera/PrimaryCamera";
// import PiPCamera from "./camera/PiPCamera"; // Importing PiP Camera

// const MainScene = () => {
//   return (
//     <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
//       {/* Primary Camera */}
//       <PrimaryCamera position={[10, 10, 10]} lookAt={[0, 2, 0]} />

//       {/* Lights */}
//       <AmbientLight />
//       <DirectionalLight
//         color="yellow"
//         intensity={1.5}
//         position={[7, 3, 5]}
//         targetPosition={[0, 0, 0]}
//         castShadow
//         shadowProps={{
//           near: 1,
//           far: 50,
//           mapSize: [2048, 2048],
//         }}
//       />

//       {/* Objects */}
      // <Model
      //   filePath="apple.glb"
      //   scale={0.05}
      //   position={[-1.5, 0, -1]}
      //   color="red"
      // />
//       <Building />
//       <Plane />

//       {/* Controls */}
//       <OrbitControls />

//       {/* Picture-in-Picture Camera */}
//       <PiPCamera position={[0, 5, -10]} lookAt={[0, 0, 0]} />
//     </Canvas>
//   );
// };

// export default MainScene;
import React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import PrimaryCamera from "./camera/PrimaryCamera";

// Floor Component
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

// Room Component
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

// Scene Component
function Scene() {
  const roomConfigs = [
    {
      name: "blue",
      material: { color: "#0f4c5c" },
      positions: {
        wall1: { x: 0, y: 2.5, z: 2.5 },
        wall2: { x: 0, y: 2.5, z: -2.5 },
        wall3: { x: -2.5, y: 2.5, z: 0 },
        wall4: { x: -1.5, y: 2.5, z: 0 },
        wall5: { x: 0, y: 4, z: 0 },
        wall6: { x: 1.5, y: 2.5, z: 0 },
      },
    },
    {
      name: "red",
      material: { color: "#9a031e" },
      positions: {
        wall1: { x: 0, y: 2.5, z: 14.5 },
        wall2: { x: 0, y: 2.5, z: 9.5 },
        wall3: { x: -2.5, y: 2.5, z: 12 },
        wall4: { x: -13.5, y: 2.5, z: 0 },
        wall5: { x: -12, y: 4, z: 0 },
        wall6: { x: -10.5, y: 2.5, z: 0 },
      },
    },
    {
      name: "yellow",
      material: { color: "#fcf4a3" },
      positions: {
        wall1: { x: 15, y: 2.5, z: 14.5 },
        wall2: { x: 15, y: 2.5, z: 9.5 },
        wall3: { x: 17.5, y: 2.5, z: 12 },
        wall4: { x: -13.5, y: 2.5, z: 10 },
        wall5: { x: -12, y: 4, z: 10 },
        wall6: { x: -10.5, y: 2.5, z: 10 },
      },
    },
    {
      name: "orange",
      material: { color: "orange" },
      positions: {
        wall1: { x: 10, y: 2.5, z: 4.5 },
        wall2: { x: 10, y: 2.5, z: -0.5 },
        wall3: { x: 12.5, y: 2.5, z: 2 },
        wall4: { x: -3.5, y: 2.5, z: 5 },
        wall5: { x: -2, y: 4, z: 5 },
        wall6: { x: -0.5, y: 2.5, z: 5 },
      },
    },
    {
      name: "green",
      material: { color: "olive" },
      positions: {
        wall1: { x: 5, y: 2.5, z: -12.75 },
        wall2: { x: 2.5, y: 2.5, z: -10.25 },
        wall3: { x: 7.5, y: 2.5, z: -10.25 },
        wall4: { x: 1, y: 2.5, z: -7.75 },
        wall5: { x: 2.5, y: 4, z: -7.75 },
        wall6: { x: 4, y: 2.5, z: -7.75 },
      },
    },
  ];

  return (
    <>
      {/* Helpers */}
      <axesHelper args={[2]} />
      <Grid args={[100, 100]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />

      {/* Floors */}
      <Floors />

      {/* Rooms */}
      {roomConfigs.map((config) => (
        <Room key={config.name} config={config} />
      ))}
    </>
  );
}

export default function App() {
  return (
    <Canvas
      camera={{
        fov: 20,
        position: [0, 0, 100],
        near: 0.1,
        far: 400,
      }}
      className="w-screen h-screen"
    >
    <PrimaryCamera />
      <Scene />
      <OrbitControls enableDamping />
    </Canvas>
  );
}
