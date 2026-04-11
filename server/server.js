require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDb = require("./utils/connectDb");
const { initializeSocketServer } = require("./sockets");

const PORT = process.env.PORT || 8080;

async function bootstrap() {
  await connectDb();

  const server = http.createServer(app);
  const io = initializeSocketServer(server);

  app.set("io", io);

  server.listen(PORT, () => {
    console.log(`CodeCamp Arena server listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server", error);
  process.exit(1);
});
