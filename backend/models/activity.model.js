import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "review_created",
        "post_created",
        "list_created",
        "list_updated",
        "favorite_added",
        "started_following",
      ],
    },
    // Reference to the source entity
    refId: {
      type: String,
      default: null,
    },
    // Snapshot data so the feed doesn't require joins for display
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Feed query: get activities from followed users sorted by newest
activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
