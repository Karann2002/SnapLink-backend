const express = require('express');
const bcrypt = require('bcryptjs');
const dotenv = require("dotenv");
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary")
const Post = require("../models/PostModels");
const auth = require("../middleware/auth");

//login Route

dotenv.config();

router.post("/posts", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      async (error, result) => {
        if (error) return res.status(500).json({ error });

        const post = new Post({
          caption: req.body.caption,
          imageUrl: result.secure_url,
          author: req.userId,
        });

        await post.save();
        res.status(201).json(post);
      }
    );

    result.end(file.buffer); // Needed when using upload_stream
  } catch (err) {
    res.status(500).json({ error: "Post creation failed" });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check for missing fields
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // Find user by email OR username OR phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
        { phone: identifier },
      ],
    });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
      },
    });

  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});


// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, username } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      username,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

module.exports = router;
