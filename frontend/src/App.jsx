import { useRef, useEffect } from "react";
import { getHomeData } from "./api/api";
import Button from "./components/Button";
import VoiceToText from "./components/VoiceToText";
import "./styles/App.css";
import Main from "./number2/Main";
import Modal from "./components/Modal";
import "./styles/modal.css";
// import detectionResults from "RobotCamera";

function App() {
  const robotCameraRef = useRef(null);
  const miniMapCameraRef = useRef(null);

  const robotPositionRef = useRef([7, 0.1, 15]); // Default position
  const robotRotationRef = useRef([0, -Math.PI / 2, 0, 1]); // Default quaternion
  const detectObj = useRef(null);



  const triggerIndicator = useRef(0);

  useEffect(() => {
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }

  
  }, []);



  return (
    <>
      <VoiceToText />
<<<<<<< Updated upstream
      <Modal success={false} />
=======
      <Modal success={false} triggerIndicator={triggerIndicator}/>

>>>>>>> Stashed changes
      <div className="main">
        <Main
          robotCameraRef={robotCameraRef}
          miniMapCameraRef={miniMapCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
          YOLOdetectObject={detectObj}
        />
      </div>
    </>
  );
}

export default App;