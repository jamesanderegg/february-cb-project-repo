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
  isRunning,
  setTarget,
  target,
  COLAB_API_URL,
  objectsInViewRef,
  timerRef = useRef(500), // Add this parameter
  resetScene
}) => {
  // Add a ref for the ObjectRandomizer
  const randomizerRef = useRef(null);
  
  
  useEffect(() => {
    window.resetEnvironment = () => {
      console.log("🔄 Resetting environment...");

      // Clear object positions
      setObjectPositions([]);
      collisionIndicator.current = 0
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
  }, [setObjectPositions]);
  
  useEffect(() => {
    if (objectPositions && Array.isArray(objectPositions) && objectPositions.length > 0) {
      fetch(`${COLAB_API_URL}/update_objects`, {  // Change to your Google Colab URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectPositions }),
      })
        .then(response => response.json())
        .then(data => {
          console.log("✅ Object positions sent:", data);

          // Update the target with the value from the response data
          
          if (data.target) {
            console.log(data.target)
            setTarget(data.target);  // Update the target state
          }
        })
        .catch(error => console.error("❌ Error sending object positions:", error));
    } else {
      console.warn("⚠️ objectPositions is not an array or is empty:", objectPositions);
    }
  }, [objectPositions]);

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        <AmbientLight/>
        <ScaledEnvUniform scale={2} />
        <Tables tableConfigs={tableConfigs} />

        {/* Pass the ref to ObjectRandomizer */}
        <ObjectRandomizer
          ref={randomizerRef}
          tableConfigs={tableConfigs}
          setObjectPositions={setObjectPositions}
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
          target={target}
          timerRef={timerRef}
          resetScene={resetScene}
        />
      </Physics>

      {/* {socket && <ReplayControls socket={socket} />} */}
    </>
  );
};

export default MainScene;
