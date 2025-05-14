import React from "react";

// First, let's create a custom hook for scaling
// In a new file called useScaleObjects.js:
export const useScaleObjects = (scale = 1) => {
  return {
    scale: [scale, scale, scale]
  };
};