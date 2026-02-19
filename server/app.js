const express = require('express');
require('dotenv').config();

const app = express();

const userRoutes = require("./src/modules/user/user.routes");
const authRoutes = require("./src/modules/auth/auth.routes");

app.use(express.json());

app.use("/api/router", userRoutes);
app.use("/api/auth", authRoutes);

module.exports = app; 