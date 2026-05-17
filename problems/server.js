const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
   path: path.resolve(__dirname, ".env")
});

dotenv.config({
   path: path.resolve(__dirname, "../server/.env")
});

const app = require("./app");
const connectDb = require("../server/utils/connectDb");

const PORT = process.env.PROBLEMS_PORT || 5000;

async function bootstrap() {
   await connectDb();

   app.listen(PORT, () => {
      console.log(`Problems server running on ${PORT}`);
   });
}

bootstrap().catch((error) => {
   console.error("Failed to bootstrap problems server", error);
   process.exit(1);
});
