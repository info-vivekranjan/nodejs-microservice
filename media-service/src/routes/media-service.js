const express = require("express");
const multer = require("multer");

const logger = require("../utils/logger");
const { uploadMedia } = require("../controllers/mediaController");
const authenticateRequest = require("../middleware/authMiddleware");

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
      if (err instanceof multer.MulterError) {
        logger.error("Multer upload error", err);
        res.status(400).json({
          message: "Multer upload error",
          err: err,
          stack: err.stack,
        });
      } else {
        logger.error("Unknown error occoured while uploading", err);
        res.status(500).json({
          message: "Unknown error occoured while uploading",
          err: err,
          stack: err.stack,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "No file found!!",
        });
      }
      next();
    });
  },
  uploadMedia,
);

module.exports = router;
