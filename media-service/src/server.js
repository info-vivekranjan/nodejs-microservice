const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const env = require("dotenv");
env.config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-service");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const connect = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Request method - ${req.method} & Request url - ${req.url}`);
  logger.info(`Request body - ${req.body}`);

  next();
});

app.use("/api/media", mediaRoutes);

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
