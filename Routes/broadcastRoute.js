const express = require("express");
const { broadcastMessage } = require("../Controllers/broadcastController");
const authMiddleware = require("../MiddleWare/authMiddleware"); // optional

const router = express.Router();

// Only admin can send broadcast
router.post("/broadcast", broadcastMessage);

module.exports = router;
