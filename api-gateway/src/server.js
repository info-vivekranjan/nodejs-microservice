const env = require("dotenv");
env.config();
const cors = require("cors");
const express = require("express");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/errorHandler");
const { validateToken } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
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

app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info(`Request method - ${req.method} & Request url - ${req.url}`);
  logger.info(`Request body - ${req.body}`);

  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy Error ${err.message}`);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  },
};

// Setting up proxy for identity service

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity Service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from post Service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on PORT : ${PORT}`);
  logger.info(
    `Identity Service is running on : ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(`Post Service is running on : ${process.env.POST_SERVICE_URL}`);
  logger.info(`Redis Client is running on : ${process.env.REDIS_URL}`);
});
