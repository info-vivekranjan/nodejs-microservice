const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");

// Register user
const registerUser = async (req, res) => {
  logger.info("Register API hit...");

  try {
    // Validate schema
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation Error", error.details[0].message);

      return res.status(400).json({
        status: 400,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    // Check existing user
    let user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      logger.warn("User already exists.");

      return res.status(400).json({
        status: 400,
        message: "User already exists.",
      });
    }

    // Create user
    user = new User({
      email,
      password,
      username,
    });

    // Save user
    await user.save();

    logger.info("User saved successfully", user._id);

    // Generate tokens
    const { accessToken, refreshToken } = await generateToken(user);

    // Response
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);

    logger.error("Registration error occurred:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login User

const loginUser = async (req, res) => {
  logger.info("Login API hit...");
  try {
    // Validate schema
    const { error } = validateLogin(req.body);

    if (error) {
      logger.warn("Validation Error", error.details[0].message);

      return res.status(400).json({
        status: 400,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid User.");
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // User password valid or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid User Password.");
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occurred:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token
const refreshTokenController = async (req, res) => {
  logger.info("Refresh Token Hit...");

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh token missing.");

      return res.status(400).json({
        success: false,
        message: "Refresh token missing.",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < Date.now()) {
      logger.warn("Invalid or expired refresh token.");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found.");
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateToken(user);
    // Delete the old Refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    return res.status(201).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error occurred:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  logger.info("Logout user API Hit...");

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh token missing.");

      return res.status(400).json({
        success: false,
        message: "Refresh token missing.",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh Token is deleted for logout.");

    return res.status(201).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    logger.error("Logout error occoured: ", error);

    return res.status(500).json({
      success: false,
      message: "Error while Logout user",
    });
  }
};
module.exports = {
  registerUser,
  loginUser,
  refreshTokenController,
  logoutUser,
};
