const express = require("express");
const multer = require("multer");

const logger = require("../utils/logger");
const { uploadMedia } = require("../controllers/mediaController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      // Multer error
      if (err instanceof multer.MulterError) {
        logger.error("Multer upload error", err);

        return res.status(400).json({
          success: false,
          message: "Multer upload error",
          error: err.message,
        });
      }

      // Other upload error
      if (err) {
        logger.error("Unknown error occurred while uploading", err);

        return res.status(500).json({
          success: false,
          message: "Unknown error occurred while uploading",
          error: err.message,
        });
      }

      // No error, but no file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file found!",
        });
      }

      next();
    });
  },
  uploadMedia,
);

module.exports = router;
