import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getHomeData } from './api/api'
import Button from "./components/Button";

import './styles/App.css'
import MainScene from "./scene/MainScene";

function App() {
  const [count, setCount] = useState(0);
  const [apiResponse, setApiResponse] = useState(null); // To store the API response

  const handleApiCall = async () => {
    const data = await getHomeData();
    if (data) {
      setApiResponse(data.message);
      console.log(data.message)
    } else {
      setApiResponse("Failed to connect to the API");
    }
  };

  return (
    <>
      <div className="card">
      <Button onClick={() => setCount((count) => count + 1)} label="Count" />
        
          Count is {count}
          <br />
       
        <Button onClick={handleApiCall} label="Test API Connection" />
        
        <p>{apiResponse}</p>
      </div>
      <MainScene />

 
    </>
  );
}

export default App;
