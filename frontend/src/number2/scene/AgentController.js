// useAgentController.js
import { useState, useEffect, useCallback, useRef } from "react";

export const useAgentController = ({ 
  robotRef, 
  robotCameraRef, 
  robotPositionRef, 
  robotRotationRef, 
  collisionIndicator, 
  targetObject, 
  setObjectPositions, 
  COLAB_API_URL 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState("idle");
  const [lastAction, setLastAction] = useState(null);
  const [metrics, setMetrics] = useState({ 
    epsilon: 1.0, 
    loss: 0.0, 
    rewards: [] 
  });
  const [replays, setReplays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const progressIntervalRef = useRef(null);

  // Connect to agent backend
  const connectToAgent = useCallback(async (customUrl) => {
    const url = customUrl || COLAB_API_URL;
    console.log("🔍 Connecting to agent at:", url);
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const response = await fetch(`${url}/status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (data.status === "ok") {
        setIsConnected(true);
        setSuccessMessage("Connected to agent successfully");
        
        // Load available replays
        fetchReplays();
      } else {
        setErrorMessage("Unexpected response from agent");
        setIsConnected(false);
      }
    } catch (error) {
      console.error("❌ Failed to connect to agent:", error);
      setErrorMessage(`Connection failed: ${error.message}`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [COLAB_API_URL]);

  // Fetch available replays
  const fetchReplays = useCallback(async () => {
    if (!isConnected) return [];
    
    try {
      const response = await fetch(`${COLAB_API_URL}/list_replays`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log(`📋 Retrieved replays:`, data);
      
      if (data.replays && Array.isArray(data.replays)) {
        setReplays(data.replays);
        console.log(`📋 Retrieved ${data.replays.length} replays`);
        return data.replays;
      } else {
        setReplays([]);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching replays:", error);
      setErrorMessage(`Failed to fetch replays: ${error.message}`);
      return [];
    }
  }, [COLAB_API_URL, isConnected]);

  // Start agent training
  const startTraining = useCallback(async (episodes = 10, batchSize = 32) => {
    setIsLoading(true);
    setErrorMessage("");
    setAgentStatus("training");
    setTrainingProgress(0);
    
    try {
      // First make sure we have the latest replays list
      const availableReplays = await fetchReplays();
      
      if (availableReplays.length === 0) {
        throw new Error("No replay files available for training");
      }

      // Start consolidated training approach
      const response = await fetch(`${COLAB_API_URL}/start_training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          episodes: episodes, 
          batch_size: batchSize 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || "Failed to start training");
      }
      
      console.log(`🚀 Started training with ${episodes} episodes`);
      setSuccessMessage(`Training started with ${data.replay_count || availableReplays.length} replays`);
      
      // Set up progress monitoring
      startMonitoringProgress();
      
      return true;
    } catch (error) {
      console.error("❌ Training error:", error);
      setErrorMessage(`Training error: ${error.message}`);
      setAgentStatus("idle");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [COLAB_API_URL, fetchReplays]);

  // Stop agent training
  const stopTraining = useCallback(async () => {
    try {
      const response = await fetch(`${COLAB_API_URL}/stop_training`, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || "Failed to stop training");
      }
      
      console.log("⏹️ Training stopped");
      setAgentStatus("idle");
      setSuccessMessage("Training stopped");
      
      // Clean up progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Fetch the latest agent status
      fetchAgentStatus();
      
      return true;
    } catch (error) {
      console.error("❌ Error stopping training:", error);
      setErrorMessage(`Failed to stop training: ${error.message}`);
      return false;
    }
  }, [COLAB_API_URL]);

  // Start agent inference (epsilon-greedy exploration)
  const startInference = useCallback(async () => {
    try {
      // Toggle agent mode to inference
      const response = await fetch(`${COLAB_API_URL}/toggle_agent_training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("🔮 Inference mode enabled", data);
      setAgentStatus("inference");
      setSuccessMessage("Agent switched to inference mode");
      
      return true;
    } catch (error) {
      console.error("❌ Error starting inference:", error);
      setErrorMessage(`Failed to start inference: ${error.message}`);
      return false;
    }
  }, [COLAB_API_URL]);

  // Fetch current agent status
  const fetchAgentStatus = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const response = await fetch(`${COLAB_API_URL}/agent_training_status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("📊 Agent status:", data);

      // Update metrics
      setMetrics({
        epsilon: data.epsilon || 1.0,
        loss: data.last_loss || 0.0,
        rewards: [...(metrics.rewards || [])], // Keep existing rewards
        memorySize: data.memory_size || 0,
        episodesCompleted: data.episodes_trained || 0
      });
      
      // Update training progress if available
      if (data.training_progress !== undefined) {
        setTrainingProgress(data.training_progress);
      }
      
      // Update status if we're training
      if (data.status === 'training') {
        setAgentStatus('training');
      } else if (agentStatus === 'training' && data.status !== 'training') {
        setAgentStatus('idle');
        setSuccessMessage("Training completed");
      }
      
    } catch (error) {
      console.error("❌ Error fetching agent status:", error);
    }
  }, [COLAB_API_URL, isConnected, agentStatus, metrics.rewards]);

  // Monitor training progress
  const startMonitoringProgress = useCallback(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Start a new interval
    const progressInterval = setInterval(async () => {
      try {
        await fetchAgentStatus();
        
        // Check if training is still active
        if (agentStatus !== "training") {
          clearInterval(progressInterval);
          setTrainingProgress(100);
        }
      } catch (error) {
        console.error("Failed to fetch training progress:", error);
      }
    }, 1000);
    
    // Store the interval ID
    progressIntervalRef.current = progressInterval;
    
    // Auto-cleanup after 10 minutes (failsafe)
    setTimeout(() => {
      if (progressIntervalRef.current === progressInterval) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, 10 * 60 * 1000);
    
    return progressInterval;
  }, [fetchAgentStatus, agentStatus]);

  // Initial status check on connection
  useEffect(() => {
    if (isConnected) {
      fetchAgentStatus();
      fetchReplays();
    }
    
    // Cleanup on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isConnected, fetchAgentStatus, fetchReplays]);

  // Provide all the agent control functions
  return {
    // Connection
    connectToAgent,
    
    // Training functions
    startTraining,
    stopTraining,
    startInference,
    
    // Replay management
    fetchReplays,
    
    // Status and data
    agentStatus,
    isConnected,
    lastAction,
    metrics,
    replays,
    isLoading,
    trainingProgress,
    errorMessage,
    successMessage,
    
    // Clear messages
    clearMessages: () => {
      setErrorMessage("");
      setSuccessMessage("");
    }
  };
};