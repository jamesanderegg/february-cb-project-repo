import React from "react";
import { Physics } from "@react-three/rapier";
import Plane from "./Plane";
import Model from "../helper/Model";

const MainScene = () => {
  return (
    <Physics>
      {/* Ground Plane */}
      <Plane width={50} height={50} color="darkgray" showHelper={true} />

      {/* Load Models */}
      <Model 
        filePath="/models/apple.glb" 
        scale={0.01} 
        position={[2, 2, 0]} 
        rotation={[0, Math.PI / 4, 0]} 
        color="red"
        showHelper={true}
      />
      <Model 
        filePath="/models/keys1.glb" 
        scale={0.08} 
        position={[-5, 1, 0]} 
        rotation={[0, -Math.PI / 6, 0]} 
        color="gold"
        showHelper={true}
      />
      <Model 
        filePath="/models/keys1.glb" 
        scale={0.08} 
        position={[-2, 1, 0]} 
        rotation={[0, -Math.PI / 6, 0]} 
        color="gold"
        showHelper={true}
      />
    </Physics>
  );
};

export default MainScene;
