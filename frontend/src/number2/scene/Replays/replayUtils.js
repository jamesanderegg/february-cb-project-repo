/**
 * Utility functions for handling replay files
 */

/**
 * Parse object positions from replay file or objects file
 * 
 * @param {Object|Array} data - The loaded replay data or object positions
 * @returns {Array} - Array of formatted object positions
 */
export const parseObjectPositions = (data) => {
    if (!data) return [];
    
    // Handle different formats of object position data
    
    // Case 1: Direct array of object positions
    if (Array.isArray(data)) {
      return formatObjectPositions(data);
    }
    
    // Case 2: Object with metadata.object_positions
    if (typeof data === 'object' && data.metadata && Array.isArray(data.metadata.object_positions)) {
      return formatObjectPositions(data.metadata.object_positions);
    }
    
    // Case 3: Object with objectPositions property
    if (typeof data === 'object' && Array.isArray(data.objectPositions)) {
      return formatObjectPositions(data.objectPositions);
    }
    
    // Case 4: Object with direct object_positions property
    if (typeof data === 'object' && Array.isArray(data.object_positions)) {
      return formatObjectPositions(data.object_positions);
    }
    
    console.warn('⚠️ Could not find object positions in data:', data);
    return [];
  };
  
  /**
   * Format object positions to ensure they have correct structure
   * 
   * @param {Array} positions - Raw object positions
   * @returns {Array} - Formatted object positions
   */
  export const formatObjectPositions = (positions) => {
    if (!Array.isArray(positions)) return [];
    
    return positions.map(obj => {
      // Ensure object has all required properties
      const formattedObj = {
        ...obj,
        id: obj.id || obj.name || `object-${Math.random().toString(36).substr(2, 9)}`,
        position: obj.position || [0, 0, 0],
        rotation: obj.rotation || [0, 0, 0],
        scale: obj.scale || 1,
        physicsProps: {
          mass: obj.mass || obj.physicsProps?.mass || 1,
          type: 'dynamic',
          linearDamping: obj.linearDamping || obj.physicsProps?.linearDamping || 0.5,
          angularDamping: obj.angularDamping || obj.physicsProps?.angularDamping || 0.5,
          friction: obj.friction || obj.physicsProps?.friction || 0.7,
          restitution: obj.restitution || obj.physicsProps?.restitution || 0
        }
      };
      
      return formattedObj;
    });
  };
  
  /**
   * Parse replay actions from replay file
   * 
   * @param {Object|Array} data - The loaded replay data
   * @returns {Array} - Array of replay steps
   */
  export const parseReplaySteps = (data) => {
    if (!data) return [];
    
    // Handle different formats of replay data
    
    // Case 1: Direct array of episodes
    if (Array.isArray(data)) {
      // First element is the first episode
      return data[0] || [];
    }
    
    // Case 2: Object with episodes array
    if (typeof data === 'object' && Array.isArray(data.episodes)) {
      return data.episodes[0] || [];
    }
    
    console.warn('⚠️ Could not find replay steps in data:', data);
    return [];
  };
  
  /**
   * Extract robot initial position from replay
   * 
   * @param {Array} steps - Replay steps
   * @returns {Object} - Initial position and rotation
   */
  export const getInitialRobotState = (steps) => {
    if (!Array.isArray(steps) || steps.length === 0) {
      return { position: [7, 0.1, 15], rotation: [0, -Math.PI / 2, 0, 1] };
    }
    
    const firstStep = steps[0];
    
    if (!firstStep || !firstStep.state || firstStep.state.length < 6) {
      return { position: [7, 0.1, 15], rotation: [0, -Math.PI / 2, 0, 1] };
    }
    
    return {
      position: firstStep.state.slice(0, 3),
      rotation: [...firstStep.state.slice(3, 6), 1] // Add w component for quaternion
    };
  };
  
  export default {
    parseObjectPositions,
    formatObjectPositions,
    parseReplaySteps,
    getInitialRobotState
  };