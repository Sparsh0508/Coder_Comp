const dotenv = require("dotenv")
dotenv.config();
const app = require('./app')
const runMigrations = require("./src/config/migrate")

const PORT = process.env.PORT || 5000;
(async () => {
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`Server Is Running On PORT ${PORT}`);
  });
})();