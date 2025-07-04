import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";

import SceneEnvironment from "./scene/V2_SceneEnvironment";


const V2_MainCanvas = (
    {
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
        setTargetObject,
        replayStepTriggerRef,
        modelPositionsRef,
        objectsInViewRef,
        onCaptureImage,
        topDownCameraRef,
        robotCameraRef,
        replayPositions,
       handleStopRecording 
    }
) => {

    return (
        <Canvas shadows
            camera={{ position: [30, 25, 35], fov: 50 }}
            style={{
                width: "100vw",
                height: "100vh",
                position: "absolute",
                zIndex: 1
            }}>
            <Physics gravity={[0, -9.81, 0]}>
                <SceneEnvironment
                    robotPositionRef={robotPositionRef}
                    robotRotationRef={robotRotationRef}
                    keysPressed={keysPressed}
                    collisionIndicator={collisionIndicator}
                    liveStateRef={liveStateRef}
                    recordingBufferRef={recordingBufferRef}
                    isRecordingActiveRef={isRecordingActiveRef}
                    frameResetRef={frameResetRef}
                    timerRef={timerRef}
                    currentActionRef={currentActionRef}
                    controlMode={controlMode}
                    setTargetObject={setTargetObject}
                    replayStepTriggerRef={replayStepTriggerRef}
                    modelPositionsRef={modelPositionsRef}
                    objectsInViewRef={objectsInViewRef}
                    onCaptureImage={onCaptureImage}
                    topDownCameraRef={topDownCameraRef}
                    robotCameraRef={robotCameraRef}
                    replayPositions={replayPositions}
                    handleStopRecording ={handleStopRecording}
                />

            </Physics>
        </Canvas>

    );
}


export default V2_MainCanvas;