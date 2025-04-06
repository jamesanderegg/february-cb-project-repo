

const MiniMapHUD = ({ miniMapImage }) => {
  
  
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
    }}>
      {miniMapImage ? (
        <img src={miniMapImage} alt="MinMap View" style={{ width: "100%", height: "100%" }} />
      ) : (
        <span style={{ color: "white" }}>Loading...</span>
      )}
    </div>
  );
};


export default MiniMapHUD;