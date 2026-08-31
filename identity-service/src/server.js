const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const env = require("dotenv");
env.config();
const express = require("express");
const logger = require("./utils/logger");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");
const connect = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5001;

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

// DDos protection and rate limit
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // 10req
  duration: 1, //1sec
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.error(`Rate limit exceeded for ip ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests.",
      });
    });
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

//Apply sensitiveEndpointLimiterto routes
app.use("/api/auth/register", sensitiveEndpointLimiter);

// Add Routes
app.use("/api/auth", routes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, async () => {
  await connect();
  logger.info(`Identity Server running on : ${PORT}`);
});

//Unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.info(`Unhandled Rejection at: ${promise} - Reason: ${reason}`);
});
