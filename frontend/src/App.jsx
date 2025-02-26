import { useRef, useEffect, useState } from "react";
import Button from "./components/Button";
import VoiceToText from "./components/VoiceToText";
import "./styles/App.css";
import Main from "./number2/Main";
import Modal from "./components/Modal";
import "./styles/modal.css";
import DQNController from "./ai/DQNController";

function App() {
  const robotCameraRef = useRef(null);
  const miniMapCameraRef = useRef(null);
  const robotPositionRef = useRef([7, 0.1, 15]); // Default position
  const robotRotationRef = useRef([0, -Math.PI / 2, 0, 1]); // Default quaternion
  const detectObj = useRef(null);
  const collisionIndicator = useRef(0);
  
  // Add DQN Controller
  const [dqnController] = useState(new DQNController());
  const [aiMode, setAiMode] = useState(false);
  const [targetObject, setTargetObject] = useState("chair");
  
  // Load model when component mounts
  useEffect(() => {
    const loadAIModel = async () => {
      // Replace with path to your converted model
      const modelUrl = '/models/tfjs_model/model.json';
      const success = await dqnController.loadModel(modelUrl);
      console.log("AI model loaded:", success);
    };
    
    loadAIModel();
  }, [dqnController]);
  
  // Start robot camera when component mounts
  useEffect(() => {
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }
  }, []);
  
  // Add AI control loop
  useEffect(() => {
    if (!aiMode) return;
    
    let aiLoopId;
    const aiControlLoop = () => {
      // Get current state from refs
      const state = dqnController.getStateFromRefs(
        robotPositionRef,
        robotRotationRef,
        detectObj,
        collisionIndicator
      );
      
      // Select action
      const actionIndex = dqnController.selectAction(state);
      const actionKey = dqnController.getActionKey(actionIndex);
      
      // Execute action by simulating keypress
      const event = new KeyboardEvent('keydown', {
        key: actionKey,
        code: `Key${actionKey.toUpperCase()}`,
        keyCode: actionKey.charCodeAt(0),
        which: actionKey.charCodeAt(0)
      });
      document.dispatchEvent(event);
      
      // Schedule next AI action (adjust timing as needed)
      aiLoopId = setTimeout(aiControlLoop, 200);
    };
    
    // Start AI control loop
    aiLoopId = setTimeout(aiControlLoop, 200);
    
    // Clean up
    return () => {
      if (aiLoopId) clearTimeout(aiLoopId);
    };
  }, [aiMode, dqnController, targetObject]);

  return (
    <>
      <VoiceToText />
      <Modal success={false} collisionIndicator={collisionIndicator}/>
      
      {/* Add AI Control Button */}
      <div className="ai-controls">
        <button onClick={() => setAiMode(!aiMode)}>
          {aiMode ? "Stop AI" : "Start AI"}
        </button>
        <select 
          value={targetObject}
          onChange={(e) => setTargetObject(e.target.value)}
          disabled={aiMode}
        >
          <option value="chair">Chair</option>
          <option value="table">Table</option>
          <option value="book">Book</option>
          <option value="cup">Cup</option>
          <option value="laptop">Laptop</option>
        </select>
        <div>Target: {targetObject}</div>
        <div>AI Mode: {aiMode ? "ON" : "OFF"}</div>
      </div>

      <div className="main">
        <Main
          robotCameraRef={robotCameraRef}
          miniMapCameraRef={miniMapCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={detectObj}
          collisionIndicator={collisionIndicator}
        />
      </div>
      {aiMode && (
      <div className="ai-debug">
        <h4>AI Debug</h4>
        <div>Position: {JSON.stringify(robotPositionRef.current)}</div>
        <div>Rotation: {JSON.stringify(robotRotationRef.current)}</div>
        <div>Detected Objects: {
          (detectObj?.current?.detections || [])
            .map(d => `${d.class_name} (${d.confidence.toFixed(2)})`)
            .join(', ')
        }</div>
        <div>Target: {targetObject}</div>
        <div>Collision: {collisionIndicator.current ? "YES" : "NO"}</div>
      </div>
    )}
    </>
  );
}

export default App;