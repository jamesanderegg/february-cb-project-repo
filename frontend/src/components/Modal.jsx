import { useState, useEffect } from "react";

const Modal = ({ success = false }) => {
  const [isVisible, setIsVisible] = useState(false); // Initially hidden modal
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500); // Match this with CSS animation duration
    };

    if (isVisible) {
      document.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`modal-overlay ${isLeaving ? "leaving" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        opacity: 1,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <div
        className={`modal-content ${isLeaving ? "leaving" : ""}`}
        style={{
          backgroundColor: success ? "#4CAF50" : "white",
          padding: "2rem",
          borderRadius: "10px",
          maxWidth: "500px",
          width: "90%",
          textAlign: "center",
          transform: "translateY(0)",
          transition: "transform 0.5s ease-in-out",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginBottom: "1rem", color: success ? "white" : "#333" }}>
          {success ? "Congratulations!!!" : "Meet Buggy! He can find things in the environment!"}
        </h2>
        <p style={{ lineHeight: "1.6", color: success ? "white" : "#666" }}>
          {success
            ? "The robot successfully found the item, great job!"
            : "Please press the mic button to instruct the robot to find the object in the area. When done speaking press the stop recording button and the robot will begin its item search!"}
        </p>
      </div>
    </div>
  );
};

export default Modal;
