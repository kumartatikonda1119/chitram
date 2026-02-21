import mongoose from "mongoose";

const listItemSchema = new mongoose.Schema(
  {
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

listItemSchema.index({ listId: 1, movieId: 1 }, { unique: true });

export default mongoose.model("ListItem", listItemSchema);
