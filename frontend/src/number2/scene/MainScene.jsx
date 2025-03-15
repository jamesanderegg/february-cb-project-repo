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
  setTarget,
  target
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
      fetch("https://1acd-104-199-170-14.ngrok-free.app/update_objects", {  // Change to your Google Colab URL
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
          
          metallic={0.8}
          roughness={0.3}
          robotCameraRef={robotCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={YOLOdetectObject}
          collisionIndicator={collisionIndicator}
          objectPositions={objectPositions}
          setObjectPositions={setObjectPositions}
        />
      </Physics>

      {/* {socket && <ReplayControls socket={socket} />} */}
    </>
  );
};

export default MainScene;




// function RobotScene() {
//   // Set up refs
//   const buggyRef = useRef();
//   const robotCameraRef = useRef();
//   const robotPositionRef = useRef([0, 0, 0]);
//   const robotRotationRef = useRef([0, 0, 0, 0]);
//   const collisionIndicator = useRef(false);
//   const [objectPositions, setObjectPositions] = useState([]);
//   const [targetObject, setTargetObject] = useState(1); // YOLO class ID for target
  
//   // Initialize agent controller
//   const agentController = useAgentController({
//     robotRef: buggyRef,
//     robotCameraRef,
//     robotPositionRef,
//     robotRotationRef,
//     collisionIndicator,
//     targetObject,
//     setObjectPositions
//   });
  
//   // YOLO detection callback
//   const handleYOLODetection = useCallback((detections) => {
//     // This will be called by your YOLO system when objects are detected
//     console.log("YOLO detections:", detections);
//   }, []);
  
//   return (
//     <Canvas>
//       <Physics>
//         <Environment preset="apartment" />
//         <Room />
        
//         {/* Your robot with agent integration */}
//         <Buggy
//           ref={buggyRef}
//           robotCameraRef={robotCameraRef}
//           robotPositionRef={robotPositionRef}
//           robotRotationRef={robotRotationRef}
//           collisionIndicator={collisionIndicator}
//           YOLOdetectObject={handleYOLODetection}
//           setObjectPositions={setObjectPositions}
//           targetObject={targetObject}
//         />
        
//         {/* Objects to detect */}
//         {objectPositions.map((pos, index) => (
//           <DetectableObject 
//             key={index}
//             position={pos} 
//             classId={index % 3} // Assign different class IDs
//           />
//         ))}
//       </Physics>
      
//       {/* Agent control panel (outside of Canvas) */}
//       <div style={{ position: 'absolute', top: 20, right: 20 }}>
//         <button onClick={() => agentController.connectToAgent('http://your-ngrok-url.io/api')}> 
//           Connect Agent
//         </button>
//       </div>
//     </Canvas>
//   );
// }