import { Physics } from "@react-three/rapier";
import ScaledEnv from './staticSceneElements/ScaledEnv'

import Buggy from "./Buggy";

function MainScene({ robotCameraRef, robotPositionRef, robotRotationRef, YOLOdetectObject, collisionIndicator }) {



    return (
        <Physics gravity={[0, -9.81, 0]}>
            <ScaledEnv />


            <Buggy
                position={[7, 0.1, 15]}
                scale={0.025}
                rotation={[0, -Math.PI / 2, 0]}
                metallic={0.8}
                roughness={0.3}
                robotCameraRef={robotCameraRef}
                robotPositionRef={robotPositionRef}
                robotRotationRef={robotRotationRef}
                YOLOdetectObject={YOLOdetectObject}
                collisionIndicator={collisionIndicator}
            />
        </ Physics>
    )
}
export default MainScene