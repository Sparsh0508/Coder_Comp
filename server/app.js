const express = require('express')
const app = expess();
const userRoutes = require("./src/modules/user/user.routes")
const authRoutes = require("./src/modules/auth/auth.routes")
app.use("/api/router", userRoutes)
app.use("/apit/auth",authRoutes)
module.exports = app;