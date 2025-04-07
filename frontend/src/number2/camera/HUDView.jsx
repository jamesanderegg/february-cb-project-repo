import React, { useEffect, useRef } from "react";

const HUDView = ({ getHudImage }) => {
  const imgRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const updateHud = () => {
      if (imgRef.current && getHudImage) {
        const newSrc = getHudImage();
        if (imgRef.current.src !== newSrc) {
          imgRef.current.src = newSrc;
        }
      }
      animationFrameId = requestAnimationFrame(updateHud);
    };

    updateHud(); // start loop

    return () => cancelAnimationFrame(animationFrameId);
  }, [getHudImage]);

  return (
    <div style={{
      position: "absolute",
      top: "5px",
      left: "240px",
      width: "200px",
      height: "200px",
      backgroundColor: "black",
      border: "2px solid white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img ref={imgRef} alt="HUD View" style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default HUDView;
