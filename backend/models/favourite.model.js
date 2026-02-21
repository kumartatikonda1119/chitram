import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Favourite = mongoose.model("Favorite", favoriteSchema);
export default Favourite;
