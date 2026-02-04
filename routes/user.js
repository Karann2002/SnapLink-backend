const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/auth");
const { updateProfile } = require("../controllers/userControllers");
const upload = require("../middleware/upload")


router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.find({})
      .sort({ createdAt: -1 })
     

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error", error: error.message, stack: error.stack });
  }
});

router.put("/profile/update", verifyToken, upload.single("profilePic"), updateProfile);
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log("User ID from token:", req.userId);
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error in /profile route:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/posts/:username", async (req, res) => {
  try {
    const posts = await Post.find({ authorUsername: req.params.username });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/follow", verifyToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    if (userToFollow.followers.includes(currentUser._id)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add follow
    userToFollow.followers.push(currentUser._id);
    currentUser.following.push(userToFollow._id);

    

    await userToFollow.save();
    await currentUser.save();

    res.status(200).json({ message: "Followed successfully"   });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ❌ Unfollow a user
router.post("/:id/unfollow", verifyToken, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToUnfollow || !currentUser)
      return res.status(404).json({ message: "User not found" });

    // Remove from both lists
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => !id.equals(currentUser._id)
    );
    currentUser.following = currentUser.following.filter(
      (id) => !id.equals(userToUnfollow._id)
    );

    await userToUnfollow.save();
    await currentUser.save();

    return res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id/is-following", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const profileUserId = req.params.id;

    const isFollowing = currentUser.following.includes(profileUserId);
    
    
        
    res.status(200).json({
      isFollowing,
        });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/follow-stats
router.get("/:id/follow-stats", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("followers following");
    
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


module.exports = router;
