import React, { useEffect, useRef } from "react";

const MiniMapHUD = ({ getMiniMapImage }) => {
  const imgRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const updateMiniMap = () => {
      if (imgRef.current && getMiniMapImage) {
        const newSrc = getMiniMapImage();
        if (imgRef.current.src !== newSrc) {
          imgRef.current.src = newSrc;
        }
      }
      animationFrameId = requestAnimationFrame(updateMiniMap);
    };

    updateMiniMap(); // Start update loop

    return () => cancelAnimationFrame(animationFrameId);
  }, [getMiniMapImage]);

  return (
    <div style={{
      position: "absolute",
      top: "5px",
      left: "10px",
      width: "200px",
      height: "200px",
      backgroundColor: "black",
      border: "3px solid white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <img ref={imgRef} alt="Minimap View" style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MiniMapHUD;
