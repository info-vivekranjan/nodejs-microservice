const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    logger.info("Connected to Mongo server");
  } catch (error) {
    logger.error("Mongo connection error", error);

    // setTimeout(connect, 5000); // retry after 5 sec
  }
};

module.exports = connect;
