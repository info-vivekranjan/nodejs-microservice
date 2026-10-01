const amqp = require("amqplib");
const logger = require("../utils/logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "social_media_ms_app_events";

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
      durable: false,
    });

    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ", error);
    throw error;
  }
}

module.exports = {
  connectRabbitMQ,
};
