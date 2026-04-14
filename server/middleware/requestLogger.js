const morgan = require("morgan");
const { logger } = require("../utils/logger");

const format = ":method :url :status :res[content-length] - :response-time ms";

const requestLogger = morgan(format, {
  stream: {
    write(message) {
      logger.info(message.trim(), { module: "REQUEST" });
    },
  },
});

module.exports = requestLogger;
