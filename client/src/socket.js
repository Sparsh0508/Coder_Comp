import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL || "https://coder-comp-server.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
});
