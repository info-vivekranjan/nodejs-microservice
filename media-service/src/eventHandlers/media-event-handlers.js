const Media = require("../models/Media");
const { deletMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  console.log(event, "====event===");

  const { postId, mediaIds } = event;

  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deletMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(
        `Deleted Media - ${media._id} associated with Post - ${postId}`,
      );
    }

    logger.info(`Processed deletion of the media for Post ${postId}`);
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { handlePostDeleted };
