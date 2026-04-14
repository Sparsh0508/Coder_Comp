const { logError } = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, _req, res, _next) {
  logError("ERROR", error.message || "Unhandled error", {
    stack: error.stack,
    statusCode: error.statusCode || 500,
  });
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
