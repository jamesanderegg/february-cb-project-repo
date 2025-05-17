import React from "react";

const HUDView = ({ hudImage }) => {
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
      zIndex: 9999
    }}>
      <img
        src={hudImage || ""}
        alt="HUD View"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { e.target.src = ""; }}
      />
      {!hudImage && <span style={{ color: "white", fontSize: "12px" }}>No image</span>}

    </div>
  );
};

export default HUDView;
