const express = require("express");
const router = express.Router();

const { sendMessage, getMessages } = require("../controllers/messageController");

// send a new message
router.post("/", sendMessage);

// get messages between two users
router.get("/:sender/:receiver", getMessages);

module.exports = router;
