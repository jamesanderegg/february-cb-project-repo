import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { useHelper } from '@react-three/drei'

import './App.css'

let floorSize, floorPosition, color;

// instantiate floor geometry
const Floor = ({ floorSize, floorPosition, color }) => {
  // Use floorSize to determine the plane geometry dimensions
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={floorPosition}>
      <planeGeometry args={[floorSize[0], floorSize[1]]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}

let wallPosition;

// instantiate wall geometry
//Left Wall
const Wall1 = ({wallPosition, color }) => {
  return (
    <mesh position={wallPosition}>
      <planeGeometry args={[5, 5]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}
//Right Wall
const Wall2 = ({wallPosition, color }) => {
  return (
    <mesh position={wallPosition}>
      <planeGeometry args={[5, 5]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}
// Back Wall
const Wall3 = ({wallPosition, color }) => {
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={wallPosition}>
      <planeGeometry args={[5, 5]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}
//Left Door Wall
const Wall4 = ({wallPosition, color }) => {
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={wallPosition}>
      <planeGeometry args={[2, 5]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}
//Middle Door Wall
const Wall5 = ({wallPosition, color }) => {
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={wallPosition}>
      <planeGeometry args={[1, 2]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}
//Right Door Wall
const Wall6 = ({wallPosition, color }) => {
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={wallPosition}>
      <planeGeometry args={[2, 5]} /> {/* room wall size */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}


// // room wall material
// const Wall = ({wallPosition, color }) => (
//   <meshBasicMaterial color={color} side={THREE.DoubleSide} />
// )

const Scene = () => {
  return(
  <Canvas>
  
    {/* Add elements to the Scene */}

    {/* Add walls group  */}
      {/* <group>doorwall</group>  doorway group */}
      {/* <group>blueWalls</group>
      <group>redWalls</group>
      <group>yellowWalls</group>
      <group>orangeWalls</group>
      <group>greenWalls</group> */}

    {/* Add floor geometries */}
    {/* Rooms -- See Colors */}
    <Floor floorSize={[5, 5]} floorPosition={[0, 0, 0]} color="blue" />
    <Floor floorSize={[5, 5]} floorPosition={[0, 0, 12]} color="red" />
    <Floor floorSize={[5, 5]} floorPosition={[15, 0, 12]} color="yellow" />
    <Floor floorSize={[5, 5]} floorPosition={[10, 0, 2]} color="#cc5801" />  {/* Orange */}
    <Floor floorSize={[5, 5]} floorPosition={[5, 0, -10.25]} color="darkgreen" />
    {/* Hallways */}
    <Floor floorSize={[5, 17.5]} floorPosition={[5, 0, 1]} color="brown" /> {/* vertical hallway */}
    <Floor floorSize={[10, 5]} floorPosition={[7.5, 0, 12]} color="brown" /> {/* horizontal hallway */}
      
    {/* Add wall geometries */}
    {/* Rooms */}
    <group color='#0f4c5c'> {/* blue */}
      <Wall1 wallPosition={[0, 2.5, 2.5]} />
      <Wall2 wallPosition={[0, 2.5, -2.5]} />
      <Wall3 wallPosition={[-2.5, 2.5, 0]} />
      {/* Door Wall */}
      <Wall4 wallPosition={[-1.5, 2.5, 0]} />
      <Wall5 wallPosition={[0, 4, 0]} />
      <Wall6 wallPosition={[1.5, 2.5, 0]} />
    </group>
    <group color='#5c0f0f'> {/* red */}
      <Wall1 wallPosition={[0, 2.5, 14.5]} />
      <Wall2 wallPosition={[0, 2.5, 9.5]} />
      <Wall3 wallPosition={[-2.5, 2.5, 12]} />
      {/* Door Wall */}
      <Wall4 wallPosition={[-13.5, 2.5, 0]} />
      <Wall5 wallPosition={[0, 4, 0]} />
      <Wall6 wallPosition={[-10.5, 2.5, 0]} />
    </group>
    <group color='#5c5c0f'> {/* yellow */}
      <Wall1 wallPosition={[15, 2.5, 14.5]} />
      <Wall2 wallPosition={[15, 2.5, 9.5]} />
      <Wall3 wallPosition={[17.5, 2.5, 12]} />
      {/* Door Wall */}
      <Wall4 wallPosition={[-13.5, 2.5, 10]} />
      <Wall5 wallPosition={[-12, 4, 10]} />
      <Wall6 wallPosition={[-10.5, 2.5, 10]} />
    </group>
    <group color='#cc5801'> {/* orange */}
      <Wall1 wallPosition={[10, 2.5, 2.5]} />
      <Wall2 wallPosition={[10, 2.5, -.5]} />
      <Wall3 wallPosition={[-3.5, 2.5, 2]} />
      {/* Door Wall */}
      <Wall4 wallPosition={[-3.5, 2.5, 5]} />
      <Wall5 wallPosition={[-2, 4, 5]} />
      <Wall6 wallPosition={[-.5, 2.5, 5]} />
    </group>
    <group color='#0f5c0f'> {/* green */}
      <Wall1 wallPosition={[5, 2.5, -20.75]} />
      <Wall2 wallPosition={[2.5, 2.5, -10.25]} />
      <Wall3 wallPosition={[7.5, 2.5, -10.25]} />
      {/* Door Wall */}
      <Wall4 wallPosition={[1, 2.5, -7.75]} />
      <Wall5 wallPosition={[2.5, 4, -7.75]} />
      <Wall6 wallPosition={[4, 2.5, -7.75]} />
    </group>


  

      {/* Initialize Lights -- Lights helper below instantiation */}
      <ambientLight intensity={0.8}/>
      <directionalLight position={[0,0,25]}/>

      {/* useHelper(directionalLight, DirectionalLightHelper, 'cyan') */}
      {/* useHelper(GridHelper, 'cyan') */}

      {/* Perspective Camera Initialization */}
      <perspectiveCamera
        makeDefault
        position={[10, 10, 35]}
        near={0.1}
        far={5}
      />

      <OrbitControls />
    </Canvas>
  )
}

const App = () => {
  return (
    <Scene />
    
  )
}

export default App
