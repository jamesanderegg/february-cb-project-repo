import React from "react";


import Plane from "./Plane";

// Modified ScaledEnvUniform component
const ScaledEnvUniform = ({ scale = 2 }) => {
  

  return (
    <group >
      {/* Ground Plane */}
      <Plane width={50} height={50} color="darkgray" showHelper={true} />

    </group>
  );
};

export default ScaledEnvUniform;