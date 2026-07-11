import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["movie", "tv"],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    targetTitle: {
      type: String,
      default: "",
    },
    targetPoster: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// One review per user per content item
reviewSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// Fetch all reviews for a movie/show (sorted by newest)
reviewSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });

// Fetch all reviews by a user (sorted by newest)
reviewSchema.index({ userId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
