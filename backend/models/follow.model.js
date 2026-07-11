import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "pending"],
      default: "accepted",
    },
  },
  { timestamps: true },
);

// Prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Efficiently query followers / following lists
followSchema.index({ followingId: 1, status: 1 });
followSchema.index({ followerId: 1, status: 1 });

const Follow = mongoose.model("Follow", followSchema);
export default Follow;
