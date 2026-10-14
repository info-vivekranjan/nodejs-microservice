const Search = require("../models/Search.js");
const logger = require("../utils/logger");

const serachPostController = async (req, res) => {
  logger.info("Search endpoint hit..");
  try {
    const { query } = req.query;
    const result = await Search.find(
      { $text: { $search: query } },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    return res.status(200).json({
      success: false,
      data: result,
    });
  } catch (error) {
    logger.error("Error while searching post==", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while searching.",
    });
  }
};

module.exports = { serachPostController };
