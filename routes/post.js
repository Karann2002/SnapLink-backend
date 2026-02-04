const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middleware/auth");
const Post = require("../models/PostModels");
const User = require("../models/User");
const Notification = require("../models/notifications");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require("../utils/cloudinary");
const { createNotification } = require("./../controllers/notificationController");

// Create a new post
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { caption ,profilePicUrl} = req.body;

    const fileBuffer = req.file?.buffer;
    if (!fileBuffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert buffer to Data URI
    const base64File = fileBuffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64File}`;

    // Detect if it's an image or video
    const resourceType = req.file.mimetype.startsWith("video") ? "video" : "image";

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: resourceType === "video" ? "reels" : "posts", // Store in different folders
      resource_type: resourceType, // IMPORTANT for video uploads
    });

    // Save post
    const newPost = new Post({
      caption,
      imageUrl: uploadResult.secure_url, // works for both image & video
      mediaType: resourceType,           // store type in DB
      author: req.userId,
      authorProfilePicUrl: profilePicUrl,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});


// Get all posts
router.get("/", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("author", "username fullName");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: error.stack,
    });
  }
});

router.get("/mine", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .populate("author", "username fullName");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  // console.log("Requested username:", username);

  try {
    const user = await User.findOne({ username });
    
    // console.log("Matched user:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ author: user._id })
    .sort({ createdAt: -1 })
    .populate(
      "author",
      "username fullName"
    );
    // console.log("User's posts:", posts);
    res.status(200).json(posts);
    // res.json(posts);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/like/:postId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("author", "username");
    const userId = req.userId;

    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      const newNotification = new Notification({
        recipient: post.author._id, 
        sender: userId,             
        type: "like",
        post: post._id,
      });

      await newNotification.save();
    }

    await post.save();
    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likes: post.likes,
    });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Error updating likes", error: err.message });
  }
});

router.put("/comment/:postId", verifyToken, async (req, res) => {
  try {
    const { text, userCommentProfilePicUrl } = req.body;
    const userId = req.userId;

    const post = await Post.findById(req.params.postId).populate("author", "username");
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text, userCommentProfilePicUrl });
    await post.save();

    // ✅ Create Notification
    if (post.author._id.toString() !== userId) {
      const notification = new Notification({
        recipient: post.author._id,
        sender: userId,
        type: "comment",
        post: post._id,
        text: `${req.user.username} commented: "${text}"`,
      });
      await notification.save();
     
    }

    res.status(200).json({ message: "Comment added successfully" });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Error updating comments", error: err.message });
  }
});


router.get("/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("comments.userId", "username") // populate username
      .select("comments");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post.comments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching comments", error: err.message });
  }
});

module.exports = router;
