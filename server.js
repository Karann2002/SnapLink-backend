const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const searchRoutes = require("./routes/search");
const userRoutes = require("./routes/user");
const messageRoutes = require("./routes/message");
const conversationsRoutes = require("./routes/conversationRoutes");

// Models
const Message = require("./models/messageSchema");
const Conversation = require("./models/coversation");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

const server = http.createServer(app);

// Handle SPA (React Router) fallback
app.get("/", (req, res) => {
  return res.send("home page")
});

app.use(cors({
  origin: ["http://localhost:5173" ,"https://snaplink-backend-ttci.onrender.com"], // frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// APIs
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationsRoutes);

app.get("/api", (req, res) => {
  res.send("✅ API is running...");
});

// --- Socket.io setup
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173"], methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  // console.log("✅ User connected:", socket.id);

  // --- User joins their room
  socket.on("join", (userId) => {
    socket.userId = userId;
    socket.join(userId);
    // console.log(`User ${userId} joined their personal room`);
  });

  // --- Like Post
  socket.on("likePost", ({ postId, userId }) => {
    io.emit("postLiked", { postId, userId });
  });

  // --- Comment Post
  socket.on("commentPost", ({ postId, userId }) => {
    io.emit("postCommented", { postId, userId });
  });

  // --- Send Private Message
  socket.on("privateMessage", async (msgData) => {
    try {
      const message = await Message.create({
        sender: msgData.sender,
        receiver: msgData.receiver,
        text: msgData.text,
        senderProfilePic: msgData.senderProfilePic,
        receiverProfilePic: msgData.receiverProfilePic,
      });

      let conversation = await Conversation.findOne({
        participants: { $all: [msgData.sender, msgData.receiver] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [msgData.sender, msgData.receiver],
          lastMessage: message._id,
        });
      } else {
        conversation.lastMessage = message._id;
        await conversation.save();
      }

      // Send to receiver + echo back to sender
      io.to(msgData.receiver).emit("receiveMessage", message);
      io.to(msgData.sender).emit("receiveMessage", message);
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  // --- Notifications
  socket.on("sendNotification", ({ receiverId, notification }) => {
    io.to(receiverId).emit("getNotification", notification);
  });

  // --- Disconnect
  socket.on("disconnect", () => {
    // console.log("❌ User disconnected:", socket.id);
  });
});


// --- MongoDB + Server Start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));


  connectDB()
