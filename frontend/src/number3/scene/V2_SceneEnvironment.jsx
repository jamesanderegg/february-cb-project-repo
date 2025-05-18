import React, { useRef, useEffect } from "react";
import { Environment } from "@react-three/drei";

import OrbitControls from "../controls/OrbitControls.jsx";
import AmbientLight from "../lights/AmbientLight.jsx";
import SpotLights from "../lights/Spotlights.jsx";

import Plane from "./StaticSceneElements/ScaledEnvironment/V2_Plane.jsx";
import Tables from "./StaticSceneElements/Tables/Tables.jsx"
import { tableConfigs } from './StaticSceneElements/Tables/tableConfig.js';
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnvironment/ScaledEnv.jsx";

import Buggy from "./V2_Buggy.jsx";
import RobotCamera from "../camera/V2_RobotCamera.jsx";
import TopDownCamera from "../camera/V2_TopDownCamera.jsx";
import ObjectRandomizer from "./ModelFunctions/ObjectRandomizer.jsx";
import { useSceneReset } from '../hooks/useSceneReset';
import useManualKeyboardControls from "../hooks/useManualKeyboardControls.jsx";
import { useCountdownTimer } from '../hooks/useCountdownTimer';


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
    currentActionRef,
    controlMode,
    modelPositionsRef,
    replayPositions,
    setTargetObject,
    replayStepTriggerRef,
    objectsInViewRef,
    onCaptureImage,
    topDownCameraRef,
    robotCameraRef
}) => {
    const buggyRef = useRef();
    const cameraRef = useRef();
    const objectPositionsRef = useRef([]);
    const controlModeRef = useRef("manual");
    const randomizerRef = useRef(null);

    const setObjectPositions = (positions) => {
        objectPositionsRef.current = positions;
    };

    useEffect(() => {
        controlModeRef.current = controlMode;
    }, [controlMode]);

    useManualKeyboardControls(keysPressed, controlModeRef);
    useCountdownTimer(timerRef);

    useSceneReset(() => {
        console.log("🔄 Scene Reset Triggered");

        if (buggyRef.current && buggyRef.current.resetBuggy) {
            buggyRef.current.resetBuggy();
        }
        if (timerRef?.current) {
            timerRef.current = 350;
        }
        if (frameResetRef?.current) {
            frameResetRef.current();
        }
        if (recordingBufferRef?.current) {
            recordingBufferRef.current = [];
        }
        if (randomizerRef.current && randomizerRef.current.resetEnvironment) {
            randomizerRef.current.resetEnvironment();
        }

        console.log("✅ Scene state fully reset");
    });

    return (
        <>
            <OrbitControls />
            <AmbientLight intensity={0.5} color="white" />
            <SpotLights lights={[
                { position: [5, 5, 5], color: "red", intensity: 1 },
                { position: [-5, -5, -5], color: "blue", intensity: 1 },
            ]} />
           
<Environment
  files="/textures/potsdamer_platz_1k.hdr"
  background={false}
/>


            {/* <DreiEnvironment preset="city" background={false} /> */}
            <Plane />
            <Tables tableConfigs={tableConfigs} />
            <ScaledEnvUniform scale={2} />
            <TopDownCamera
                ref={topDownCameraRef}
                robotPositionRef={robotPositionRef}
                cameraHeight={60}
            />
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
                frameResetRef={frameResetRef}
                timerRef={timerRef}
                currentActionRef={currentActionRef}
                replayStepTriggerRef={replayStepTriggerRef}
                controlMode={controlMode}
            />

            <ObjectRandomizer
                ref={randomizerRef}
                tableConfigs={tableConfigs}
                setObjectPositions={setObjectPositions}
                modelPositionsRef={modelPositionsRef}
                replayPositions={replayPositions}
                setTargetObject={setTargetObject}
            />

            <RobotCamera
                ref={robotCameraRef}
                robotRef={buggyRef}
                objectPositions={objectPositionsRef.current}
                modelPositionsRef={modelPositionsRef}
                objectsInViewRef={objectsInViewRef}
                onCaptureImage={onCaptureImage}

            />
        </>
    );
};

export default SceneEnvironment;
