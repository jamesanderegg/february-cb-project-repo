import React from "react";
import { useScaleObjects } from "./useScaledObjects.jsx"; // custom hook

import Floors from "./Floors.jsx";
import Room from "./Room.jsx";
import OuterWalls from "./OuterWalls.jsx";
import Trellis from "./Trellis.jsx";
import roomConfigs from "./roomConfigs.js";
import Plane from "./V2_Plane.jsx";

// Modified ScaledEnvUniform component
const ScaledEnvUniform = ({ scale = 2 }) => {
  const scaleProps = useScaleObjects(scale);

  return (
    <group {...scaleProps}>
      {/* Ground Plane */}
      <Plane width={50} height={50} color="darkgray" showHelper={true} />
      <OuterWalls />
      <Trellis />
      <Floors />

      {/* Remove duplicate Room rendering */}
      {roomConfigs.map((config, index) => (
        <Room key={index} config={config} name={`wall ${index}`} />
      ))}
    </group>
  );
};

export default ScaledEnvUniform;