const express = require("express");
const {
  registerUser,
  loginUser,
  refreshTokenController,
  logoutUser,
} = require("../controller/identityController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logoutUser);

module.exports = router;
