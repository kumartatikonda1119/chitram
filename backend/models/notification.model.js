import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["follow", "post_reply", "mention", "reaction"],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index to quickly fetch a user's notifications sorted by newest
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Prevent duplicate notifications for the same exact event
notificationSchema.index(
  { recipient: 1, sender: 1, type: 1, refId: 1 },
  { unique: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
