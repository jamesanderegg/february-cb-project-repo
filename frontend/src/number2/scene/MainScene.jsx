import React, { useRef, useEffect } from "react";
import { Physics } from "@react-three/rapier";
import Model from "../helper/Model";
import ScaledEnvUniform from "./StaticSceneElements/ScaledEnv/ScaledEnv";
import Buggy from "./Buggy";
import Tables from "./StaticSceneElements/TheManyTables/Tables.jsx";
import { tableConfigs } from './StaticSceneElements/TheManyTables/tableConfig.js';
import ObjectRandomizer from './ModelFunctions/ObjectRandomizer.jsx';
import AmbientLight from "../lights/AmbientLight.jsx";
// import ReplayControls from '../../components/ReplayControls.jsx';

const MainScene = ({
  buggyRef,
  robotCameraRef,
  robotPositionRef,
  robotRotationRef,
  YOLOdetectObject,
  collisionIndicator,
  objectPositions,
  setObjectPositions,
  modelPositionsRef,
  isRunning,
  setTarget,
  target,
  COLAB_API_URL,
  objectsInViewRef,
  timerRef = useRef(350), // Add this parameter
  resetScene,
  currentActionRef,
  onCaptureImage,
  keysPressed,      // Receive keysPressed from Main
  lastVActionTime,   // Receive lastVActionTime from Main
  physicsKey
}) => {
  // Add a ref for the ObjectRandomizer
  const randomizerRef = useRef(null);
  
  useEffect(() => {
    window.resetEnvironment = () => {
      console.log("🔄 Resetting environment...");

      // Clear object positions
      setObjectPositions([]);
      
      // Safely reset collision indicator
      if (collisionIndicator && typeof collisionIndicator.current !== 'undefined') {
        collisionIndicator.current = false; 
      }
      
      // Reset buggy position & rotation
      if (buggyRef.current) {
        console.log("🔄 Resetting buggy...");
        buggyRef.current.resetBuggy(); // Call reset method inside Buggy.jsx
      }

      // Trigger a re-randomization in ObjectRandomizer
      if (randomizerRef.current) {
        randomizerRef.current.resetEnvironment();
      }
    };

    return () => {
      delete window.resetEnvironment;
    };
  }, [setObjectPositions, collisionIndicator]);

  return (
    <>
      <Physics key={physicsKey} gravity={[0, -9.81, 0]} >
        <AmbientLight/>
        <ScaledEnvUniform scale={2} />
        <Tables tableConfigs={tableConfigs} />

        {/* Pass the ref to ObjectRandomizer */}
        <ObjectRandomizer
          ref={randomizerRef}
          tableConfigs={tableConfigs}
          setObjectPositions={setObjectPositions}
          modelPositionsRef={modelPositionsRef}
        />

        <Buggy
          ref={buggyRef}
          scale={0.025}
          color="white"
          robotCameraRef={robotCameraRef}
          YOLOdetectObject={YOLOdetectObject}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          collisionIndicator={collisionIndicator}
          objectPositions={objectPositions}
          setObjectPositions={setObjectPositions}
          COLAB_API_URL={COLAB_API_URL}
          objectsInViewRef={objectsInViewRef}
          modelPositionsRef={modelPositionsRef}
          target={target}
          timerRef={timerRef}
          resetScene={resetScene}
          currentActionRef={currentActionRef}
          onCaptureImage={onCaptureImage}
          keysPressed={keysPressed}      // Pass keysPressed to Buggy
          lastVActionTime={lastVActionTime}  // Pass lastVActionTime to Buggy
        />
      </Physics>
    </>
  );
};

export default MainScene;