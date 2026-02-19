const express = require('express')
const app = expess();
const userRoutes = require("./src/modules/user/user.routes")
app.use("/api/router", userRoutes)
module.exports = app;