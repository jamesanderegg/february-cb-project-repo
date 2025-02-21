import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const PrimaryCamera = ({ position = [10, 10, 10], lookAt = [0, 2, 0] }) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...lookAt);
  }, [camera, position, lookAt]);

  return null;
};

export default PrimaryCamera;
