import React from "react";
import { Grid } from "@react-three/drei";
import Floors from "./Floors";
import Room from "./Room";
import Plane from "./Plane";

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
        {/* <Grid args={[100, 100]} /> */}
  
    
        {/* Floors */}
        <Floors />
        
        {/* Rooms */}
        {roomConfigs.map((config) => (
          <Room key={config.name} config={config} />
        ))}

        <Plane />
      </>
    );
  }

export default Scene;