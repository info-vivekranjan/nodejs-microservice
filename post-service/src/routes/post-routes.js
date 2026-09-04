const express = require("express");
const router = express.Router();

const { createPost } = require("../controllers/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");

router.use(authenticateRequest);

router.post("/create-post", createPost);

module.exports = router;
