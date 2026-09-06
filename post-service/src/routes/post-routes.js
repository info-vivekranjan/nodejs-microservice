const express = require("express");
const router = express.Router();

const {
  createPost,
  getAllPosts,
  getSinglePost,
  deleteSinglePost,
} = require("../controllers/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/get-all-posts", getAllPosts);
router.get("/:id", getSinglePost);
router.delete("/:id", deleteSinglePost);

module.exports = router;
