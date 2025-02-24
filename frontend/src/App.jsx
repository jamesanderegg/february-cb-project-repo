import { useRef, useEffect } from "react";
import { getHomeData } from "./api/api";
import Button from "./components/Button";
import VoiceToText from "./components/VoiceToText";
import "./styles/App.css";
import Main from "./number2/Main";
import Modal from "./components/Modal";
import "./styles/modal.css";

function App() {
  const robotCameraRef = useRef(null);
  const miniMapCameraRef = useRef(null);

  const robotPositionRef = useRef([7, 0.1, 15]); // Default position
  const robotRotationRef = useRef([0, -Math.PI / 2, 0, 1]); // Default quaternion

  const positionDisplayRef = useRef(null);
  const rotationDisplayRef = useRef(null);

  useEffect(() => {
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }

    const updateHUD = () => {
      if (positionDisplayRef.current && rotationDisplayRef.current) {
        const pos = Array.isArray(robotPositionRef.current) && robotPositionRef.current.length === 3
          ? robotPositionRef.current
          : [0, 0, 0]; // Fallback

        const rot = Array.isArray(robotRotationRef.current) && robotRotationRef.current.length === 4
          ? robotRotationRef.current
          : [0, 0, 0, 1]; // Fallback

        positionDisplayRef.current.innerText = `Position: ${pos
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;

        rotationDisplayRef.current.innerText = `Rotation (Quaternion): ${rot
          .map((val) => (typeof val === "number" ? val.toFixed(2) : "0.00"))
          .join(", ")}`;
      }

      requestAnimationFrame(updateHUD);
    };

    requestAnimationFrame(updateHUD);
  }, []);

  return (
    <>
      <div className="card">
        <Button onClick={() => console.log("Count button clicked")} label="Count" />
      </div>

      <VoiceToText />
      <Modal success={false} />

      {/* ✅ Robot State updates without re-rendering */}
      <div className="robot-state">
        <h3>Robot State</h3>
        <p ref={positionDisplayRef}>Position: Loading...</p>
        <p ref={rotationDisplayRef}>Rotation (Quaternion): Loading...</p>
      </div>

      <div className="main">
        <Main
          robotCameraRef={robotCameraRef}
          miniMapCameraRef={miniMapCameraRef}
          robotPositionRef={robotPositionRef}
          robotRotationRef={robotRotationRef}
        />
      </div>
    </>
  );
}

export default App;
