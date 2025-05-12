import React, { useRef } from "react";
import { Environment as DreiEnvironment } from "@react-three/drei";

import OrbitControls from "../controls/OrbitControls.jsx";
import AmbientLight from "../lights/AmbientLight.jsx";
import SpotLights from "../lights/Spotlights.jsx";
import Plane from "./V2_Plane.jsx";


import Buggy from "./V2_Buggy.jsx";


import { useSceneReset } from '../hooks/useSceneReset';
import useManualKeyboardControls from "../hooks/useManualKeyboardControls.jsx";
import useStateCollector from "../hooks/useStateCollector.jsx";

const SceneEnvironment = ({
    robotPositionRef,
    robotRotationRef,
    keysPressed,
    collisionIndicator,
    liveStateRef,
    recordingBufferRef,
    isRecordingActiveRef,
    frameResetRef,
    timerRef,
}) => {
    const buggyRef = useRef(); // 


    const setObjectPositions = () => { }; // placeholder for now

    const isManualControlRef = useRef(true);
    useManualKeyboardControls(keysPressed, isManualControlRef);

    useSceneReset(() => {
        console.log("🔄 Scene Reset Triggered");

        // 1. Reset the robot
        if (buggyRef.current && buggyRef.current.resetBuggy) {
            buggyRef.current.resetBuggy();
        }

        // 2. Reset timer
        if (timerRef?.current) {
            timerRef.current = 350; // or setTimer(350)
        }

        // 3. Reset frame counter
        if (frameResetRef?.current) {
            frameResetRef.current(); // call resetFrameCount
        }

        // 4. Clear recording buffer
        if (recordingBufferRef?.current) {
            recordingBufferRef.current = [];
        }

        console.log("✅ Scene state fully reset");
    });




    return (
        <>
            <OrbitControls />
            <AmbientLight intensity={0.5} color="white" />
            <SpotLights
                lights={[
                    { position: [5, 5, 5], color: "red", intensity: 1 },
                    { position: [-5, -5, -5], color: "blue", intensity: 1 },
                ]}
            />
            <DreiEnvironment preset="city" background={false} />

            <Plane />

            <Buggy
                ref={buggyRef}
                scale={0.02}
                robotPositionRef={robotPositionRef}
                robotRotationRef={robotRotationRef}
                collisionIndicator={collisionIndicator}
                setObjectPositions={setObjectPositions}
                keysPressed={keysPressed}
                liveStateRef={liveStateRef}
                recordingBufferRef={recordingBufferRef}
                isRecordingActiveRef={isRecordingActiveRef}

            />

        </>
    );
};

export default SceneEnvironment;
