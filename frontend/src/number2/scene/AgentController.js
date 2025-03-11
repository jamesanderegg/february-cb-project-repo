// AgentController.js
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const useAgentController = ({ 
  robotRef, 
  robotCameraRef,
  robotPositionRef, 
  robotRotationRef,
  collisionIndicator,
  targetObject,
  setObjectPositions
}) => {
  // Agent state
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, training, inference
  const [isConnected, setIsConnected] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [metrics, setMetrics] = useState({
    loss: 0,
    rewards: [],
    epsilon: 1.0
  });
  
  // References
  const apiBaseUrl = useRef('');
  const pollingInterval = useRef(null);
  const metricsInterval = useRef(null);
  const currentState = useRef(null);
  const isProcessingAction = useRef(false);
  
  // Connect to agent API
  const connectToAgent = (baseUrl = 'http://localhost:8000/api') => {
    apiBaseUrl.current = baseUrl;
    
    // Check server status first
    axios.get(`${baseUrl}/status`)
      .then(response => {
        console.log("Server status:", response.data);
        setIsConnected(true);
        
        // Start metrics polling
        startMetricsPolling();
      })
      .catch(error => {
        console.error('Failed to connect to agent:', error);
        setIsConnected(false);
      });
  };

  // Start polling for metrics
  const startMetricsPolling = () => {
    if (metricsInterval.current) {
      clearInterval(metricsInterval.current);
    }
    
    // Poll for metrics every 2 seconds
    metricsInterval.current = setInterval(() => {
      if (isConnected) {
        axios.get(`${apiBaseUrl.current}/metrics`)
          .then(response => {
            setMetrics({
              loss: response.data.loss || 0,
              rewards: response.data.rewards || [],
              epsilon: response.data.epsilon || 1.0
            });
            
            // Update status based on metrics
            if (response.data.is_training) {
              setAgentStatus('training');
            } else {
              setAgentStatus('inference');
            }
          })
          .catch(error => {
            console.error('Error fetching metrics:', error);
          });
      }
    }, 2000);
  };
  
  // Stop all polling
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    if (metricsInterval.current) {
      clearInterval(metricsInterval.current);
      metricsInterval.current = null;
    }
  };

  // Send current state to the agent and get next action
  const sendStateToAgent = () => {
    if (!isConnected || isProcessingAction.current) return;
    
    // Set flag to prevent multiple simultaneous requests
    isProcessingAction.current = true;
    
    // Get YOLO detections from robot camera
    const detections = robotCameraRef.current?.getDetections() || [];
    
    // Build state data
    const stateData = {
      robot_position: robotPositionRef.current || [0, 0, 0],
      robot_rotation: robotRotationRef.current || [0, 0, 0, 0], // Quaternion
      collision_indicator: collisionIndicator.current || false,
      time_left: 300, // Some default value for remaining time
      detections: detections.map(detection => ({
        class_id: detection.classId,
        bbox: detection.bbox,
        confidence: detection.confidence
      })),
      target_object: targetObject,
      is_training: agentStatus === 'training'
    };
    
    // Save current state for later reward calculation
    currentState.current = stateData;
    
    // Send state and get action
    axios.post(`${apiBaseUrl.current}/state`, stateData)
      .then(response => {
        // Process action response
        const action = response.data.action;
        setLastAction(action);
        
        // Execute the action
        executeAction(action);
      })
      .catch(error => {
        console.error('Error sending state:', error);
        isProcessingAction.current = false;
      });
  };
  
  // Execute a specific action on the robot
  const executeAction = (action) => {
    if (!robotRef.current) {
      isProcessingAction.current = false;
      return;
    }
    
    const keysMap = {
      'w': () => simulateKeyPress('w'),
      's': () => simulateKeyPress('s'),
      'a': () => simulateKeyPress('a'),
      'd': () => simulateKeyPress('d'),
      'v': () => {
        // Take picture - trigger YOLO detection and stop
        robotCameraRef.current?.captureFrame();
        // After capturing, send outcome back to agent
        reportActionOutcome(action, true);
      }
    };
    
    if (keysMap[action]) {
      keysMap[action]();
    } else {
      isProcessingAction.current = false;
    }
  };
  
  // Simulate pressing a key for movement
  const simulateKeyPress = (key) => {
    // Create synthetic key events
    const keyDownEvent = new KeyboardEvent('keydown', { key });
    const keyUpEvent = new KeyboardEvent('keyup', { key });
    
    // Dispatch events
    window.dispatchEvent(keyDownEvent);
    
    // Release key after a short time
    setTimeout(() => {
      window.dispatchEvent(keyUpEvent);
      
      // Report outcome to agent
      reportActionOutcome(key);
    }, 200); // Hold key for 200ms
  };
  
  // Report outcome of an action back to agent
  const reportActionOutcome = (action, isTerminal = false) => {
    if (!isConnected) {
      isProcessingAction.current = false;
      return;
    }
    
    // Calculate reward based on new state
    const reward = calculateReward(action, isTerminal);
    
    // Get current state again for comparison
    const detections = robotCameraRef.current?.getDetections() || [];
    const newState = {
      robot_position: robotPositionRef.current || [0, 0, 0],
      robot_rotation: robotRotationRef.current || [0, 0, 0, 0],
      collision_indicator: collisionIndicator.current || false,
      time_left: 300, // Some default value
      detections: detections.map(detection => ({
        class_id: detection.classId,
        bbox: detection.bbox,
        confidence: detection.confidence
      })),
      target_object: targetObject,
      is_training: agentStatus === 'training'
    };
    
    // Send outcome to backend
    axios.post(`${apiBaseUrl.current}/outcome`, {
      action,
      reward,
      old_state: currentState.current,
      new_state: newState,
      done: isTerminal || collisionIndicator.current,
      is_training: agentStatus === 'training'
    })
    .then(response => {
      // Reset processing flag
      isProcessingAction.current = false;
      
      // If episode is done, reset environment
      if (isTerminal || collisionIndicator.current) {
        robotRef.current?.resetBuggy();
        collisionIndicator.current = false;
      }
    })
    .catch(error => {
      console.error('Error reporting outcome:', error);
      isProcessingAction.current = false;
    });
  };
  
  // Calculate reward based on action and state change
  const calculateReward = (action, isTerminal) => {
    // Simple reward function
    let reward = 0;
    
    // Penalty for collision
    if (collisionIndicator.current) {
      return -200; // Major penalty for collision
    }
    
    // Reward for taking picture when target is in view
    if (action === 'v' && isTerminal) {
      const detections = robotCameraRef.current?.getDetections() || [];
      const targetDetected = detections.some(d => d.classId === targetObject);
      
      if (targetDetected) {
        // Size-based reward (closer is better, up to a point)
        const targetDetection = detections.find(d => d.classId === targetObject);
        const bbox = targetDetection.bbox;
        const size = (bbox[2] * bbox[3]) / (640 * 480); // normalized size
        
        // Calculate distance factor (rough estimate)
        const distance = 1.0 - size;
        const distanceUnits = distance * 5.0;
        const optimalDistance = 2.0; // Example value
        
        const distanceFactor = 1.0 - Math.min(Math.abs(distanceUnits - optimalDistance), 2.5) / 2.5;
        
        // Higher reward for better positioning
        reward = 1000 * distanceFactor;
      } else {
        // Penalty for taking picture with no target
        reward = -50;
      }
    } else if (['w', 'a', 's', 'd'].includes(action)) {
      // Small reward for movement (to encourage exploration)
      reward = 1; 
    }
    
    return reward;
  };
  
  // Start agent training
  const startTraining = () => {
    if (!isConnected) return;
    
    axios.post(`${apiBaseUrl.current}/train`, { start: true })
      .then(response => {
        setAgentStatus('training');
        
        // Start action polling if not already
        if (!pollingInterval.current) {
          pollingInterval.current = setInterval(() => {
            if (!isProcessingAction.current) {
              sendStateToAgent();
            }
          }, 300); // Poll every 300ms
        }
      })
      .catch(error => {
        console.error('Error starting training:', error);
      });
  };
  
  // Stop agent training
  const stopTraining = () => {
    if (!isConnected) return;
    
    axios.post(`${apiBaseUrl.current}/train`, { start: false })
      .then(response => {
        setAgentStatus('inference');
      })
      .catch(error => {
        console.error('Error stopping training:', error);
      });
  };
  
  // Use inference mode (no training)
  const startInference = () => {
    if (!isConnected) return;
    
    // Start in inference mode
    stopTraining();
    
    // Start action polling if not already
    if (!pollingInterval.current) {
      pollingInterval.current = setInterval(() => {
        if (!isProcessingAction.current) {
          sendStateToAgent();
        }
      }, 300); // Poll every 300ms
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);
  
  return {
    connectToAgent,
    startTraining,
    stopTraining,
    startInference,
    agentStatus,
    isConnected,
    lastAction,
    metrics
  };
};

export default useAgentController;