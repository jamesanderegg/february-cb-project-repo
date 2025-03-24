// useAgentController.js
import { useState } from "react";

export const useAgentController = ({ COLAB_API_URL }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState("idle");
  const [lastAction, setLastAction] = useState(null);
  const [metrics, setMetrics] = useState({ epsilon: 1.0, loss: 0.0, rewards: [] });

  const connectToAgent = async (customUrl) => {
    const url = customUrl || COLAB_API_URL;
    console.log("🔍 Using URL:", url);
    try {
      const response = await fetch(`${url}/status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
  
      const text = await response.text();
      console.log("📦 Raw response from /status:", text);
  
      // Try parsing after confirming it's JSON
      const data = JSON.parse(text);
      console.log("✅ Parsed JSON:", data);
  
      if (data.status === "ok") {
        setIsConnected(true);
      } else {
        console.warn("⚠️ Unexpected data:", data);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("❌ Failed to connect to agent:", error);
      setIsConnected(false);
    }
  };
  
  

  return {
    connectToAgent,
    startTraining: () => {},     // Placeholder
    stopTraining: () => {},      // Placeholder
    startInference: () => {},    // Placeholder
    agentStatus,
    isConnected,
    lastAction,
    metrics,
  };
};
