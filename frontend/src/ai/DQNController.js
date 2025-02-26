// src/DQNController.js
import * as tf from '@tensorflow/tfjs';

class DQNController {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.actions = ['w', 's', 'a', 'd', 'v']; // Match your training actions
    this.possibleObjects = ["chair", "table", "book", "cup", "laptop"];
    this.optimalDistance = 2.5;
  }

  async loadModel(modelUrl) {
    try {
      this.model = await tf.loadLayersModel(modelUrl);
      this.isLoaded = true;
      console.log('DQN model loaded successfully');
      return true;
    } catch (err) {
      console.error('Failed to load DQN model:', err);
      return false;
    }
  }

  getStateFromRefs(
    robotPositionRef, 
    robotRotationRef, 
    YOLOdetectObjectRef, 
    collisionIndicator
  ) {
    // Get position (x, y, z)
    const position = robotPositionRef.current || [0, 0, 0];
    
    // Get rotation quaternion (x, y, z, w)
    const rotation = robotRotationRef.current || [0, 0, 0, 1];
    
    // Get detected objects
    const detections = YOLOdetectObjectRef?.current?.detections || [];
    
    // Create detection encoding
    const detectionEncoding = this.possibleObjects.map(className => {
      const detection = detections.find(d => d.class_name === className);
      return detection ? detection.confidence : 0;
    });
    
    // Collision indicator
    const collision = collisionIndicator?.current ? 1 : 0;
    
    // Time feature (in your case, we don't have direct access to steps)
    // So we'll use a placeholder value of 0.5 (middle of episode)
    const timeRemaining = 0.5;
    
    // Combine all features
    return [...position, ...rotation, ...detectionEncoding, collision, timeRemaining];
  }

  selectAction(state) {
    if (!this.isLoaded) {
      console.error('Model not loaded yet');
      return 0; // Default to forward
    }

    // Convert state to tensor
    const stateTensor = tf.tensor2d([state], [1, state.length]);
    
    // Get Q-values
    const qValues = this.model.predict(stateTensor);
    
    // Get action with highest Q-value
    const actionIndex = qValues.argMax(1).dataSync()[0];
    
    // Clean up tensors
    stateTensor.dispose();
    qValues.dispose();
    
    return actionIndex;
  }

  getActionKey(actionIndex) {
    return this.actions[actionIndex];
  }
}

export default DQNController;