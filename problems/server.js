const mongoose = require("mongoose");
global.commonMongoose = mongoose;

const path = require("path");
const dotenv = require("dotenv");
// const dns = "node:dns/promises";
const dns = require("dns/promises");
dns.setServers(["1.1.1.1", "1.0.0.1"]); 
dotenv.config();
const app = require("./app");
const connectDb = require("./connectDb");

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
