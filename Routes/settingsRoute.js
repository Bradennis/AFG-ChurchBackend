const express = require("express");
const router = express.Router();
const authMiddleware = require("../MiddleWare/authMiddleware");

const {
  updateProfile,
  updateEmailNotification,
  changePassword,
} = require("../Controllers/settingsController");

router.put("/profile", authMiddleware, updateProfile);
router.put("/notifications", authMiddleware, updateEmailNotification);
router.put("/password", authMiddleware, changePassword);

module.exports = router;
