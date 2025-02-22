import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getHomeData } from "./api/api";
import Button from "./components/Button";

import "./styles/App.css";
import Main from "./number2/Main";

function App() {
  const [count, setCount] = useState(0);
  const [apiResponse, setApiResponse] = useState(null); // To store the API response
  const [capturedImage, setCapturedImage] = useState(null); // Store captured image
  const robotCameraRef = useRef(null); // Reference for RobotCamera

  const handleApiCall = async () => {
    const data = await getHomeData();
    if (data) {
      setApiResponse(data.message);
      console.log(data.message);
    } else {
      setApiResponse("Failed to connect to the API");
    }
  };

  const handleCapture = async () => {
    console.log("Capture button clicked!");

    if (!robotCameraRef.current) {
      console.error("RobotCamera is not ready!");
      return;
    }

    try {
      const image = await robotCameraRef.current.captureImage(); // Await async Promise

      if (!image) {
        console.error("Failed to capture image.");
        return;
      }

      setCapturedImage(image);
      // console.log("Captured Image (Base64):", image);

      const response = await fetch("http://127.0.0.1:5000/robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image }),
      });

      const result = await response.json();
      console.log("Response from Flask:", result);
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };

  return (
    <>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)} label="Count" />
        <p>Count is {count}</p>

        <Button onClick={handleApiCall} label="Test API Connection" />
        <Button onClick={handleCapture} label="Capture Image" />

        <p>{apiResponse}</p>

        {/* Display captured image preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Robot Camera View"
            style={{ maxWidth: "200px", marginTop: "10px" }}
          />
        )}
      </div>

      <div className="main">
        <Main robotCameraRef={robotCameraRef} onCapture={handleCapture} />
      </div>
    </>
  );
}

export default App;
