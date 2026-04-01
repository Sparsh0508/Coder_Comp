const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

const userRoutes = require("./src/modules/user/user.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const dashboardRoutes = require("./src/modules/dashboard/dashboard.routes.js")
app.use(express.json());

app.use("/api/router", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.post("/_ping", (req, res) => {
  res.status(200).json({ ok: true });
});
module.exports = app; 