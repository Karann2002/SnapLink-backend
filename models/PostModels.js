const mongoose = require("mongoose");


const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userCommentProfilePicUrl : {type: String}
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User"   },
    imageUrl : String ,
    mediaType : String,
    caption: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who liked
    comments: [CommentSchema],
    authorProfilePicUrl : { type: String   },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Post", postSchema);


// const postSchema = new mongoose.Schema({
//   caption: String,
//   imageUrl: String,
//   author: { type: mongoose.Schema.Types.ObjectId, ref: "User"   },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Post", postSchema);
