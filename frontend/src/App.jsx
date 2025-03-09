import { useRef, useEffect, useState, useMemo } from "react";
import Button from "./components/Button";
import VoiceToText from "./components/VoiceToText";
import "./styles/App.css";
import Main from "./number2/Main";
import Modal from "./components/Modal";
import "./styles/modal.css";


function App() {
  const robotCameraRef = useRef(null);
  const miniMapCameraRef = useRef(null);
  const robotPositionRef = useRef([7, 0.1, 15]);
  const robotRotationRef = useRef([0, -Math.PI / 2, 0, 1]);
  const detectObj = useRef(null);
  const collisionIndicator = useRef(0);

  const [isRunning, setIsRunning] = useState(true); // ✅ Add isRunning state
  const [target, setTarget] = useState(null);
  console.log("App re-rendering");

  useEffect(() => {
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }
  }, []);

  const mainProps = useMemo(() => ({
    robotCameraRef,
    miniMapCameraRef,
    robotPositionRef,
    robotRotationRef,
    YOLOdetectObject: detectObj,
    collisionIndicator,
    isRunning,         
    setIsRunning,
    setTarget   
  }), [isRunning, target]); 

  return (
    <>
      <VoiceToText />
      <Modal success={false} collisionIndicator={collisionIndicator} />
      <div className="main">
        <Main {...mainProps} />
      </div>
    </>
  );
}

export default App;
