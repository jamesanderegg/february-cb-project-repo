// Robot View
import React, { useEffect, useState } from "react";

const HUDView = ({ robotCameraRef }) => {
  const [hudImage, setHudImage] = useState(null);

  useEffect(() => {
    const updateHud = () => {
      if (robotCameraRef?.current?.getHudImage) {
        const hudData = robotCameraRef.current.getHudImage();
        if (hudData) {
          setHudImage(hudData);
        }
      }
    };

    const interval = setInterval(updateHud, 100); // Update HUD every 100ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, [robotCameraRef]);

  return (
    <div
      style={{
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
      }}
    >
      {hudImage ? (
        <img
          src={hudImage}
          alt="HUD View"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <span style={{ color: "white", fontSize: "14px" }}>Loading...</span>
      )}
    </div>
  );
};

export default HUDView;
