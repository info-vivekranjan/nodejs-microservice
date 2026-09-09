const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting Media Upload...");

  try {
    if (!req.file) {
      logger.warn("Please add the file upload and try again.");
      return res.status(400).json({
        success: false,
        message: "Please add the file upload and try again.",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File Details - name:${originalname} & mimeType: ${mimetype}`);
    logger.info("Upload to cloudinary started...");

    let cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload successfully - upload_id: ${cloudinaryUploadResult.public_id}`,
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error while uploading media", error);
    return res.status(500).json({
      success: false,
      message: "Error while uploading media",
    });
  }
};

module.exports = { uploadMedia };
