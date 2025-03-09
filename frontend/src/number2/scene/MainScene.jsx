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
  robotCameraRef,
  robotPositionRef,
  robotRotationRef,
  YOLOdetectObject,
  collisionIndicator,
  objectPositions,
  setObjectPositions,
  // socket
}) => {
  // Add a ref for the ObjectRandomizer
  const randomizerRef = useRef(null);
  const buggyRef = useRef(null);
  
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
      fetch("https://466a-35-221-10-216.ngrok-free.app/update_objects", {  // Change to your Google Colab URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectPositions }),
      })
        .then(response => response.json())
        .then(data => console.log("✅ Object positions sent:", data))
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
          
          metallic={0.8}
          roughness={0.3}
          robotCameraRef={robotCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={YOLOdetectObject}
          collisionIndicator={collisionIndicator}
          setObjectPositions={setObjectPositions}
        />
      </Physics>

      {/* {socket && <ReplayControls socket={socket} />} */}
    </>
  );
};

export default MainScene;