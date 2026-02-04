const Message = require("../models/messageSchema");
const Conversation = require("../models/coversation");

// ✅ Send a new message
const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!text || !sender || !receiver) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save the new message
    const message = await Message.create({ sender, receiver, text });

    // Find if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });

    if (!conversation) {
      // create new conversation
      conversation = new Conversation({
        participants: [sender, receiver],
        lastMessage: message._id,
        unread: { [receiver]: 1 }, // start unread for receiver
      });
    } else {
      // update conversation
      conversation.lastMessage = message._id;

      // increase unread for receiver
      const currentUnread = conversation.unread.get(receiver.toString()) || 0;
      conversation.unread.set(receiver.toString(), currentUnread + 1);
    }

    await conversation.save();

    res.status(201).json({ message, conversation });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all messages between two users
const getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    if (!sender || !receiver) {
      return res.status(400).json({ error: "Sender and receiver are required" });
    }

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).json({ error: err.message });
  }
};



const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username fullName profilePicUrl")
      .populate("lastMessage");

    const formatted = conversations.map(conv => {
      const participant = conv.participants.find(
        p => p._id.toString() !== userId
      );

      return {
        _id: conv._id,
        participant, // 👈 now frontend gets full user details
        lastMessage: conv.lastMessage,
        unreadCount: conv.unread.get(userId.toString()) || 0, // 👈 safe access
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error in getConversations:", err);
    res.status(500).json({ error: "Server error" });
  }
};



module.exports = { sendMessage, getMessages,getConversations  };
