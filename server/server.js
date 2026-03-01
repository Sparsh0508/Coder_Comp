// server.js (or index.js)
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const runMigrations = require("./src/config/migrate");

const PORT = process.env.PORT || 8081;


(async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server Is Running On PORT ${PORT}`);
  });
})();