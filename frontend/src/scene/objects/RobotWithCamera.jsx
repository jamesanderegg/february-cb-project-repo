import React, { useRef } from "react";
import RobotCamera from "../camera/RobotCamera"
import Model from "../../helper/Model";

// Main Robot Component
export default function RobotWithCamera({ position }) {
  const robotRef = useRef();

  return (
    <>
      {/* Robot Model */}
      <Model ref={robotRef} filePath="robot.glb" scale={0.02} position={position} />

      {/* Camera attached to the robot */}
      <RobotCamera robotRef={robotRef} />
    </>
  );
}
