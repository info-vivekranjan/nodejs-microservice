const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const connect = require("./config/db");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5002;

// Redis Client
const redisClient = new Redis(process.env.REDIS_URL);

// Middleware

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Request method - ${req.method} & Request url - ${req.url}`);
  logger.info(`Request body - ${req.body}`);

  next();
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Senstive endpoint rate limit exceed for ip: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests.",
    });
  },

  // Redis store configuration
  store: new RedisStore({
    sendCommand: (commandName, ...args) => {
      return redisClient.call(commandName, ...args);
    },
  }),
});

//Use sensitiveEndpointLimiter for post servies as required
app.use("/api/posts/create-post", sensitiveEndpointLimiter);

// Use Route -> also passing Redis client to controller for caching

app.use(
  "/api/posts",
  (req, res, next) => {
    req.resdisClient = redisClient;
    next();
  },
  postRoutes,
);

//Error handler middleware
app.use(errorHandler);

app.listen(PORT, async () => {
  await connect();
  logger.info(`Post Server running on : ${PORT}`);
});

//Unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.info(`Unhandled Rejection at: ${promise} - Reason: ${reason}`);
});
