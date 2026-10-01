const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const connect = require("./config/db");
const { connectRabbitMQ } = require("./utils/rabbitmq");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());
app.use(cors());
app.use(helmet());

// Redis Client
const redisClient = new Redis(process.env.REDIS_URL);

app.use((req, res, next) => {
  logger.info(`Request method - ${req.method} & Request url - ${req.url}`);
  logger.info(`Request body - ${req.body}`);

  next();
});

// Use Route -> also passing Redis client to controller for caching
app.use(
  "/api/serach",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  // postRoutes,
);

//Error handler middleware
app.use(errorHandler);

app.listen(PORT, async () => {
  try {
    await connect();
    await connectRabbitMQ();
    logger.info(`Post Server running on : ${PORT}`);
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
});

//Unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.info(`Unhandled Rejection at: ${promise} - Reason: ${reason}`);
});
