const Search = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
    logger.info(
      `Serach post created - ${event.postId} -- ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error(
      "Error while handeling post creatation event in search==",
      error,
    );
  }
}

async function handlePostDeleted(event) {
  try {
    await Search.findByIdAndDelete({
      postId: event.postId,
    });
    logger.info(`Serach post deleted - ${event.postId}`);
  } catch (error) {
    logger.error("Error while deleting post event in search==", error);
  }
}

module.exports = { handlePostCreated, handlePostDeleted };
