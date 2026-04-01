// server.js (or index.js)
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const {Server}= require("socket.io");
const socketAuth = require("./src/middleware/socketAuth");
const matchSocket = require("./src/modules/match/match.socket");
const app = require("./app");
const runMigrations = require("./src/config/migrate");

const PORT = process.env.PORT || 8081;
const http = require("http");
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.use(socketAuth);
matchSocket(io);
(async () => {
  await runMigrations();
  server.listen(PORT, () => {
    console.log(`Server Is Running On PORT ${PORT}`);
  });
})();