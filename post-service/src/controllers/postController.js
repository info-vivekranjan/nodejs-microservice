const Post = require("../models/Post");
const logger = require("../utils/logger");

const createPost = async (req, res) => {
  try {
    logger.info("Create Post API hit...");

    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content: content,
      mediaIds: mediaIds || [],
    });

    await Post.save();
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
