// src/api/socket.js or wherever it lives
import { io } from "socket.io-client";

// Disable autoConnect
export const socket = io("http://localhost:5000", {
  autoConnect: false
});

// Optional: listen for confirmation message
socket.on('connected', (data) => {
  console.log(data.msg); // "You are connected!"
});
