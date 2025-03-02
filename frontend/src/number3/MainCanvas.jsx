
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import OrbitControls from "./contols/OrbitControls";

import PrimaryCamera from "./camera/PrimaryCamera";
import TopDownCamera from "../number3/camera/TopDownCamera";
import MiniMapHUD from "../number3/camera/MiniMapHUD";
import HUDView from "../number3/camera/HUDView";
import MainScene from "./scene/MainScene";


function MainCanvas() {
    const robotPositionRef = useRef(null)
    const robotRotationRef = useRef(null)

    const robotCameraRef = useRef(null);
    const miniMapCameraRef = useRef(null);
    const positionDisplayRef = useRef(null);
    const rotationDisplayRef = useRef(null);
    const detectionDisplayRef = useRef(null);
    const robotStateDisplayRef = useRef(null);


    const YOLOdetectObject = useRef(null)
    const robotMemoryRef = useRef([]);
    const collisionIndicator = useRef(null);
    robotPositionRef.current = [0, 0, 0]
    return (
        <>
            <Canvas
                shadows
                camera={{ position: [7, 1, 30], fov: 50 }}
                style={{ width: "100vw", height: "100vh" }}
            >
                <PrimaryCamera position={[7, 1, 30]} />
                <OrbitControls />

                <TopDownCamera ref={miniMapCameraRef} robotPositionRef={robotPositionRef} />

                <Environment preset="apartment" />
                <MainScene 
                robotCameraRef={robotCameraRef}
                robotPositionRef={robotPositionRef}
                robotRotationRef={robotRotationRef}
                YOLOdetectObject= {YOLOdetectObject}
                collisionIndicator={collisionIndicator}
                />

            </Canvas>
            {/* HUD Views Container */}
            <div className="hud-container">
                <div className="mini-map-container">
                    <MiniMapHUD miniMapCameraRef={miniMapCameraRef} />
                </div>

                <div className="robot-camera-container">
                    <HUDView robotCameraRef={robotCameraRef} />
                </div>

                <div className="robot-state-container">
                    <div className="robot-state-inline">
                        <h3 ref={robotStateDisplayRef}>Robot State: Loading...</h3>
                        <p ref={positionDisplayRef}>Position: Loading...</p>
                        <p ref={rotationDisplayRef}>Rotation (Quaternion): Loading...</p>
                        <p ref={detectionDisplayRef}>Detected Objects: Waiting...</p>
                    </div>
                </div>
            </div>
        </>
    )
}
export default MainCanvas