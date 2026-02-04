const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, gender , bio } = req.body;

    const updatedFields = {
      fullName,
      gender,
      bio,
    };

    // Upload new profile picture to Cloudinary
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "profile_pics", // optional folder
      });

      updatedFields.profilePicUrl = uploadResult.secure_url; // ✅ Cloudinary URL
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = { updateProfile };
