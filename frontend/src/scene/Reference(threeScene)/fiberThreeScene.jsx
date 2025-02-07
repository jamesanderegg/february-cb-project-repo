//translated by ChatGPT from threeScene

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Floor Component
 *
 * Creates all the floor meshes (rooms and hallways).
 */
function Floor() {
  return (
    <group>
      {/* Blue room floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>

      {/* Red room floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 12]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="red" side={THREE.DoubleSide} />
      </mesh>

      {/* Yellow room floor */}
      <mesh rotation-x={-Math.PI / 2} position={[15, 0, 12]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="yellow" side={THREE.DoubleSide} />
      </mesh>

      {/* Orange room floor */}
      <mesh rotation-x={-Math.PI / 2} position={[10, 0, 2]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="#cc5801" side={THREE.DoubleSide} />
      </mesh>

      {/* Green room floor */}
      <mesh rotation-x={-Math.PI / 2} position={[5, 0, -10.25]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="darkgreen" side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical hallway */}
      <mesh rotation-x={-Math.PI / 2} position={[5, 0, 1]}>
        <planeGeometry args={[5, 17.5]} />
        <meshBasicMaterial color="brown" side={THREE.DoubleSide} />
      </mesh>

      {/* Horizontal hallway */}
      <mesh rotation-x={-Math.PI / 2} position={[7.5, 0, 12]}>
        <planeGeometry args={[10, 5]} />
        <meshBasicMaterial color="brown" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * Walls Component
 *
 * Loops over each room configuration to create room walls—including a door wall group.
 * (For the green room, extra rotations are applied as in your original code.)
 */
function Walls() {
  // The door-section pieces use different geometries:
  // - The main wall uses a 5x5 plane.
  // - The door-section walls use 2x5, 1x2, and 2x5 planes respectively.
  const roomConfigs = [
    {
      name: 'blue',
      color: '#0f4c5c',
      positions: {
        wall1: [0, 2.5, 2.5],    // Left wall
        wall2: [0, 2.5, -2.5],   // Right wall
        wall3: [-2.5, 2.5, 0],   // Back wall
        wall4: [-1.5, 2.5, 0],   // Left door wall
        wall5: [0, 4, 0],        // Middle door wall
        wall6: [1.5, 2.5, 0]     // Right door wall
      },
      doorWallRotation: Math.PI / 2, // default door wall rotation
      extra: false
    },
    {
      name: 'red',
      color: '#9a031e',
      positions: {
        wall1: [0, 2.5, 14.5],
        wall2: [0, 2.5, 9.5],
        wall3: [-2.5, 2.5, 12],
        wall4: [-13.5, 2.5, 0],
        wall5: [-12, 4, 0],
        wall6: [-10.5, 2.5, 0]
      },
      doorWallRotation: Math.PI / 2,
      extra: false
    },
    {
      name: 'yellow',
      color: '#fcf4a3',
      positions: {
        wall1: [15, 2.5, 14.5],
        wall2: [15, 2.5, 9.5],
        wall3: [17.5, 2.5, 12],
        wall4: [-13.5, 2.5, 10],
        wall5: [-12, 4, 10],
        wall6: [-10.5, 2.5, 10]
      },
      doorWallRotation: Math.PI / 2,
      extra: false
    },
    {
      name: 'orange',
      color: 'orange',
      positions: {
        wall1: [10, 2.5, 4.5],
        wall2: [10, 2.5, -0.5],
        wall3: [12.5, 2.5, 2],
        wall4: [-3.5, 2.5, 5],
        wall5: [-2, 4, 5],
        wall6: [-0.5, 2.5, 5]
      },
      doorWallRotation: Math.PI / 2,
      extra: false
    },
    {
      name: 'green',
      color: 'olive',
      positions: {
        wall1: [5, 2.5, -12.75],
        wall2: [2.5, 2.5, -10.25],
        wall3: [7.5, 2.5, -10.25],
        wall4: [1, 2.5, -7.75],
        wall5: [2.5, 4, -7.75],
        wall6: [4, 2.5, -7.75]
      },
      doorWallRotation: Math.PI * 2, // special rotation for green door wall
      extra: true // means we rotate wall2 extra
    }
  ]

  return (
    <group>
      {roomConfigs.map(room => {
        const { name, color, positions, doorWallRotation, extra } = room

        return (
          <group key={name}>
            {/* Main Walls */}
            <mesh position={positions.wall1}>
              <planeGeometry args={[5, 5]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            <mesh
              position={positions.wall2}
              rotation={extra ? [0, Math.PI / 2, 0] : [0, 0, 0]}
            >
              <planeGeometry args={[5, 5]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={positions.wall3} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[5, 5]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} />
            </mesh>

            {/* Door Wall Group */}
            <group position={[2.5, 0, 0]} rotation={[0, doorWallRotation, 0]}>
              <mesh position={positions.wall4}>
                <planeGeometry args={[2, 5]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={positions.wall5}>
                <planeGeometry args={[1, 2]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={positions.wall6}>
                <planeGeometry args={[2, 5]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/**
 * Scene Component
 *
 * Combines helpers, lights, floors, and walls.
 */
function Scene() {
  return (
    <>
      {/* Helpers */}
      <axesHelper args={[2]} />
      {/* Using a primitive to add a GridHelper */}
      <primitive object={new THREE.GridHelper(100, 100, 'white')} />

      {/* Light */}
      <ambientLight intensity={0.5} />

      {/* Floors */}
      <Floor />

      {/* Walls */}
      <Walls />
    </>
  )
}

/**
 * App Component
 *
 * The Canvas sets up the renderer, camera, and control.
 */
export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 100], fov: 20, near: 0.1, far: 400 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Scene />
      <OrbitControls />
    </Canvas>
  )
}
