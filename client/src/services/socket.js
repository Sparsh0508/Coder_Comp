import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "https://coder-comp-server.onrender.com", {
      withCredentials: true,
      autoConnect: false,
      reconnection: false,
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
