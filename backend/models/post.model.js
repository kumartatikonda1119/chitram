import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    // Movies tagged/mentioned in the post
    taggedMovies: [
      {
        tmdbId: { type: String, required: true },
        title: { type: String, required: true },
        type: { type: String, enum: ["movie", "tv"], default: "movie" },
        poster: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true },
);

// User's posts sorted by newest
postSchema.index({ userId: 1, createdAt: -1 });

// Global feed sorted by newest
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
