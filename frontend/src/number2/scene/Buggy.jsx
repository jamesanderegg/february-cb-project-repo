import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import RobotModel from "../helper/RobotModel";

export default function Buggy({ initialPosition = [0, 1, 0] }) {
  const buggyRef = useRef();

  return (
    <RobotModel ref={buggyRef} filePath="robot.glb" scale={0.02} position={initialPosition} />
  );
}
