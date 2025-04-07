import { useRef, useEffect, useState } from "react";
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

  const COLAB_API_URL = "https://60a9-34-23-194-130.ngrok-free.app"

  const [isRunning, setIsRunning] = useState(true);
  const [target, setTarget] = useState(null);
  // console.log("App re-rendering");

  useEffect(() => {
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }
  }, []);

  return (
    <>
      <VoiceToText />
      <Modal success={false} collisionIndicator={collisionIndicator} />
      <div className="main">
        <Main
          robotCameraRef={robotCameraRef}
          miniMapCameraRef={miniMapCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={detectObj}
          collisionIndicator={collisionIndicator}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          target={target}
          setTarget={setTarget} 
          COLAB_API_URL={COLAB_API_URL}        />
      </div>
    </>
  );
}

export default App;
