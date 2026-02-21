import Favorite from "../models/favourite.model.js";

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "Movie ID required" });
    }

    const favorite = await Favorite.create({
      userId,
      movieId,
    });

    res.status(201).json({
      message: "Movie added to favorites",
      favorite,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Already in favorites" });
    }
    res.status(500).json({ error: "Failed to add favorite" });
  }
};
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { movieId } = req.params;

    await Favorite.findOneAndDelete({
      userId,
      movieId,
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
};
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favorites = await Favorite.find({ userId });
    res.json({ favorites });
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};
