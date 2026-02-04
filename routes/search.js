// routes/search.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/PostModels');

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).limit(10);

    const posts = await Post.find({
      caption: { $regex: query, $options: 'i' }
    }).limit(10);

    const tags = await Post.find({
      tags: { $regex: query, $options: 'i' }
    }).limit(10);

    res.json({ users, posts, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
