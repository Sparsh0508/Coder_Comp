const { Server } = require("socket.io");

const { authenticateSocket } = require("./socketAuth");
const { registerMatchmakingHandlers } = require("./matchmakingSocket");

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
      credentials: true,
    },
  });

  io.use(authenticateSocket);
  registerMatchmakingHandlers(io);

  return io;
}

module.exports = {
  initializeSocketServer,
};
