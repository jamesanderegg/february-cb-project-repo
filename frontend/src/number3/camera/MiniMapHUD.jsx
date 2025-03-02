import React, { useEffect, useState } from "react";

const MiniMapHUD = ({ miniMapCameraRef }) => {
  const [miniMapImage, setMiniMapImage] = useState(null);

  useEffect(() => {
    const updateMiniMap = () => {
      if (miniMapCameraRef?.current?.getHudImage) {
        const miniMapData = miniMapCameraRef.current.getHudImage();
        if (miniMapData) {
          setMiniMapImage(miniMapData);
        }
      }
    };

    const interval = setInterval(updateMiniMap, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [miniMapCameraRef]);

  return (
    <div
      style={{
        position: "absolute",
        top: "5px",
        left: "10px",
        width: "200px",
        height: "200px",
        backgroundColor: "black",
        border: "2px solid white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {miniMapImage ? (
        <img
          src={miniMapImage}
          alt="MiniMap View"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <span style={{ color: "white", fontSize: "14px" }}>Loading...</span>
      )}
    </div>
  );
};

export default MiniMapHUD;
