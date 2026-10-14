const express = require("express");
const { serachPostController } = require("../controllers/serachController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateRequest);

router.get("/search-posts", serachPostController);

module.exports = router;
