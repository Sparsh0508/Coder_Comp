// server.js (or index.js)
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const runMigrations = require("./src/config/migrate");

const PORT = process.env.PORT || 8081;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];

app.use((req, res, next) => {
  console.log("Incoming Origin:", req.headers.origin); // remove after debug
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // do not throw
    }
  },
  credentials: true
}));
(async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server Is Running On PORT ${PORT}`);
  });
})();