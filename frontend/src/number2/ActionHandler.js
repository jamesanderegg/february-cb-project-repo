// ActionHandler.js - Unified system for managing and recording actions
import { useRef, useEffect } from 'react';

/**
 * Custom hook for handling keyboard inputs and tracking their durations
 * @param {Object} options - Configuration options
 * @param {Function} options.onActionChange - Callback when actions change
 * @param {Array} options.validKeys - List of valid keys to track
 * @param {Object} options.currentActionRef - Reference to store current actions
 * @param {Boolean} options.isRecording - Flag indicating if recording is active
 * @param {Boolean} options.isRunning - Flag indicating if the simulation is running
 * @returns {Object} - References and handlers for action state management
 */
export const useActionHandler = ({
  onActionChange = null,
  validKeys = ['w', 'a', 's', 'd', 'v'],
  currentActionRef = null,
  isRecording = false,
  isRunning = true
}) => {
  // If currentActionRef wasn't provided, create a local one
  const actionRef = useRef([]);

useEffect(() => {
  if (currentActionRef) {
    currentActionRef.current = actionRef.current;
  }
}, [currentActionRef]);

  
  // Store the pressed keys state
  const keysPressed = useRef({});
  
  // Track key durations (frames held)
  const keyDurations = useRef({
    w: 0,
    a: 0,
    s: 0,
    d: 0,
    v: 0
  });
  
  // Track the last 'v' action time for throttling
  const lastVActionTime = useRef(0);

  // Function to update current actions based on pressed keys
  const updateCurrentActions = () => {
    const pressedKeys = validKeys.filter(k => keysPressed.current[k]);
  
    actionRef.current = pressedKeys;
  
    if (currentActionRef) {
      currentActionRef.current = pressedKeys;
    }
  
    if (onActionChange) {
      onActionChange(pressedKeys);
    }
  };
  
  
  const handleKeyDown = (event) => {
    if (!isRunning) return;
  
    const key = event.key.toLowerCase();
    if (validKeys.includes(key) && !keysPressed.current[key]) {
      keysPressed.current[key] = true;
      updateCurrentActions();
    }
  };
  
  const handleKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (validKeys.includes(key) && keysPressed.current[key]) {
      keysPressed.current[key] = false;
      keyDurations.current[key] = 0;
      updateCurrentActions();
    }
  };
  
  // Update key durations on each frame
  const updateKeyDurations = () => {
    for (const key of validKeys) {
      if (keysPressed.current[key]) {
        keyDurations.current[key]++;
      }
    }
    
    // Request the next frame update
    if (isRunning) {
      requestAnimationFrame(updateKeyDurations);
    }
  };
  
  // Setup and cleanup event listeners
  useEffect(() => {
    // Add keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start tracking key durations
    const animationFrameId = requestAnimationFrame(updateKeyDurations);
    
    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  // Return all the necessary refs and state
  return {
    keysPressed,
    keyDurations, 
    lastVActionTime,
    currentActions: actionRef
  };
};

/**
 * Prepares action data for sending to the backend
 * @param {Object} actionData - Current action state
 * @returns {Object} - Formatted action data for backend
 */
export const prepareActionPayload = ({
  currentActions = [],
  keyDurations = {},
  robotPosition = [0, 0, 0],
  robotRotation = [0, 0, 0, 1],
  collision = false,
  detectedObjects = [],
  timeLeft = 350,
  targetObject = null,
  objectsInView = [],
  frameNumber = 0
}) => {
  return {
    currentActions,
    key_durations: keyDurations,
    robot_pos: robotPosition,
    robot_rot: robotRotation,
    collision: Boolean(collision),
    detectedObjects,
    time_left: timeLeft,
    target_object: targetObject,
    objectsInView,
    frame_number: frameNumber
  };
};

/**
 * Takes a picture and processes the result with the backend
 * @param {Object} options - Configuration for the picture action
 * @returns {Promise} - Result of the action processing
 */
export const takePicture = async ({
  currentState,
  COLAB_API_URL,
  onProcessed = null,
  resetScene = null
}) => {
  try {
    // Send to backend to calculate reward and process
    const response = await fetch(`${COLAB_API_URL}/process_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'v',
        state: currentState
      })
    });
    
    const data = await response.json();
    console.log("✅ Picture action processed:", data);
    
    // Call the onProcessed callback if provided
    if (onProcessed) {
      onProcessed(data);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error processing picture action:", error);
    
    // Reset scene on error if provided
    if (resetScene) {
      resetScene();
    }
    
    throw error;
  }
};

export default {
  useActionHandler,
  prepareActionPayload,
  takePicture
};