const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const LOG_DIR = process.env.LOG_DIR ? path.resolve(process.env.LOG_DIR) : path.join(__dirname, "..", "logs");

let canWriteLogFiles = true;
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const probePath = path.join(LOG_DIR, ".write_probe");
  fs.writeFileSync(probePath, "ok");
  fs.unlinkSync(probePath);
} catch {
  canWriteLogFiles = false;
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

function createRotateTransport(filename, level = "info") {
  return new DailyRotateFile({
    filename: path.join(LOG_DIR, filename),
    datePattern: "YYYY-MM-DD",
    zippedArchive: false,
    maxSize: "20m",
    maxFiles: "14d",
    level,
  });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: jsonFormat,
  defaultMeta: { service: "codecamp-arena" },
  transports: [],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: jsonFormat }));
}

if (canWriteLogFiles) {
  const appTransport = createRotateTransport("app-%DATE%.log", "info");
  const errorTransport = createRotateTransport("error-%DATE%.log", "error");

  
  [appTransport, errorTransport].forEach((transport) => {
    transport.on("error", (error) => {
     
      console.error("Logger transport error, disabling file logging:", error?.message || error);
      try {
        logger.remove(transport);
      } catch {}
    });

    logger.add(transport);
  });
} else {
  console.warn("File logging disabled: unable to create/write in LOG_DIR:", LOG_DIR);
}

function logModule(moduleName, level, message, meta = {}) {
  logger.log(level, message, { module: moduleName, ...meta });
}

const logAuth = (message, meta) => logModule("AUTH", "info", message, meta);
const logPayment = (message, meta) => logModule("PAYMENT", "info", message, meta);
const logMatch = (message, meta) => logModule("MATCH", "info", message, meta);
const logWarn = (moduleName, message, meta) => logModule(moduleName, "warn", message, meta);
const logError = (moduleName, message, meta) => logModule(moduleName, "error", message, meta);

module.exports = {
  logger,
  logModule,
  logAuth,
  logPayment,
  logMatch,
  logWarn,
  logError,
  createRotateTransport,
};
