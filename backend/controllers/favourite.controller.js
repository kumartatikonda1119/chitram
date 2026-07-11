import Favorite from "../models/favourite.model.js";
import { getCache, setCache, delCache } from "../services/redis.service.js";
import { trackInteraction } from "../services/interaction.service.js";
import Activity from "../models/activity.model.js";

const FAVOURITES_TTL = 300; // 5 minutes

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

    // Invalidate cache so next read fetches fresh data
    await delCache(`user:${userId}:favourites`);

    // Track interaction (fire-and-forget)
    trackInteraction(userId, "add_favorite", "movie", movieId).catch(() => {});

    res.status(201).json({
      message: "Movie added to favorites",
      favorite,
    });

    // Generate feed activity (fire-and-forget)
    Activity.create({
      userId,
      type: "favorite_added",
      refId: String(movieId),
      meta: { movieId },
    }).catch((err) => console.error("Activity creation failed:", err));
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

    // Invalidate cache
    await delCache(`user:${userId}:favourites`);

    // Track interaction (fire-and-forget)
    trackInteraction(userId, "remove_favorite", "movie", movieId).catch(
      () => {},
    );

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
};
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}:favourites`;

    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const favorites = await Favorite.find({ userId });
    const response = { favorites };

    // Cache for next time
    await setCache(cacheKey, response, FAVOURITES_TTL);

    res.json(response);
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};
