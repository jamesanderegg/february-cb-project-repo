import React from "react";
import { useScaleObjects } from "./useScaleObjects"; // custom hook

import Floors from "./Floors";
import Room from "./Room";
import OuterWalls from "./OuterWalls";
import Trellis from "./Trellis";
import roomConfigs from "./roomConfigs";
import Plane from "./Plane";

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
        <Room key={index} config={config} />
      ))}
    </group>
  );
};

export default ScaledEnvUniform;