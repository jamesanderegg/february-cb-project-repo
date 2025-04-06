// Robot View
import React, { useEffect, useState } from "react";

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
    }}>
      {hudImage ? (
        <img src={hudImage} alt="HUD View" style={{ width: "100%", height: "100%" }} />
      ) : (
        <span style={{ color: "white" }}>Loading...</span>
      )}
    </div>
  );
};


export default HUDView;