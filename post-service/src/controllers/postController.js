const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

async function invalidatePostCache(req, input) {
  const cachedPostKey = `post:${input}`;
  if (cachedPostKey) {
    await req.redisClient.del(cachedPostKey);
  }

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

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
    await invalidatePostCache(req, newPost._id.toString());

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const chachedPosts = await req.redisClient.get(cacheKey);

    if (chachedPosts) {
      return res.json(JSON.parse(chachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalCount = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalPosts: totalCount,
    };

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    return res.json(result);
  } catch (error) {
    logger.error("Error while getting post list", error);
    return res.status(500).json({
      success: false,
      message: "Error while getting post list.",
    });
  }
};

const getSinglePost = async (req, res) => {
  const postId = req.params.id;
  const cacheKey = `post:${postId}`;

  const cachedPost = await req.redisClient.get(cacheKey);
  if (cachedPost) {
    return res.json(JSON.parse(cachedPost));
  }

  const singlePost = await Post.findById(postId);
  if (!singlePost) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  await req.redisClient.setex(cacheKey, 300, JSON.stringify(singlePost));

  res.json(singlePost);

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

    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await invalidatePostCache(req, req.params.id);

    res.status(204).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error while deleting post", error);
    return res.status(500).json({
      success: false,
      message: "Error while deleting this post.",
    });
  }
};

module.exports = { createPost, getAllPosts, getSinglePost, deleteSinglePost };
