import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "search",
        "view_movie",
        "view_series",
        "view_person",
        "add_favorite",
        "remove_favorite",
        "create_list",
        "add_to_list",
        "explore_section",
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["movie", "tv", "person", "list", "genre"],
    },
    targetId: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Compound index for efficient user activity queries
interactionSchema.index({ userId: 1, action: 1, createdAt: -1 });

// Index for querying by target (e.g. "who viewed this movie?")
interactionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const Interaction = mongoose.model("Interaction", interactionSchema);
export default Interaction;
