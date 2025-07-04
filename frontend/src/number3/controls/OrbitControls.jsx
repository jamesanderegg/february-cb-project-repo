import React from "react";
import { OrbitControls } from "@react-three/drei";

const CustomOrbitControls = () => <OrbitControls enableDamping={true} dampingFactor={0.1} />;

export default CustomOrbitControls;
