const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

const createPost = async (req, res) => {
  try {
    logger.info("Create Post API hit...");
    const { error } = validateCreatePost(req.body);

    if (error) {
      logger.warn("Validation Error", error.details[0].message);

      return res.status(400).json({
        status: 400,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content: content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    logger.info("Post created successfully", newPost);
    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      data: newPost,
    });
  } catch (error) {
    logger.error("Error while creating post", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating post.",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    logger.info("Get all posts API hit...");
  } catch (error) {
    logger.error("Error while getting post list", error);
    return res.status(500).json({
      success: false,
      message: "Error while getting post list.",
    });
  }
};

const getSinglePost = async (req, res) => {
  try {
    logger.info("Get single post API hit...");
  } catch (error) {
    logger.error("Error while getting post", error);
    return res.status(500).json({
      success: false,
      message: "Error while getting this post.",
    });
  }
};

const deleteSinglePost = async (req, res) => {
  try {
    logger.info("Delete single post API hit...");
  } catch (error) {
    logger.error("Error while deleting post", error);
    return res.status(500).json({
      success: false,
      message: "Error while deleting this post.",
    });
  }
};

module.exports = { createPost };
