const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Conversation = require("../models/coversation");

// get all conversations for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .populate("participants", "username profilePicUrl") // must exist in User model
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePicUrl" }, // ensure Message.sender exists
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("🔥 Error fetching conversations:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
