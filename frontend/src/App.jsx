import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getHomeData } from "./api/api";
import Button from "./components/Button";

import "./styles/App.css";
import Main from "./number2/Main";

function App() {
  const [count, setCount] = useState(0);
  const [apiResponse, setApiResponse] = useState(null); // Store API response
  const robotCameraRef = useRef(null); // Reference for RobotCamera

  useEffect(() => {
    // Automatically start streaming when component mounts
    if (robotCameraRef.current) {
      robotCameraRef.current.startStreaming();
    }
  }, []);

  const handleApiCall = async () => {
    const data = await getHomeData();
    if (data) {
      setApiResponse(data.message);
      console.log(data.message);
    } else {
      setApiResponse("Failed to connect to the API");
    }
  };

  return (
    <>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)} label="Count" />
        <p>Count is {count}</p>

        <Button onClick={handleApiCall} label="Test API Connection" />

        <p>{apiResponse}</p>
      </div>

      <div className="main">
        <Main robotCameraRef={robotCameraRef} />
      </div>
    </>
  );
}

export default App;
