import ListItem from "../models/listItem.model.js";
import List from "../models/list.model.js";
import { getCache, setCache, delCache } from "../services/redis.service.js";

const LISTS_TTL = 300; // 5 minutes
const PUBLIC_LIST_TTL = 600; // 10 minutes

export const createList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "List name required" });
    }

    const list = await List.create({
      userId,
      name,
    });

    // Invalidate user's lists cache
    await delCache(`user:${userId}:lists`);

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to create list" });
  }
};

export const getUserLists = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}:lists`;

    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const lists = await List.find({ userId });

    await setCache(cacheKey, lists, LISTS_TTL);

    res.json(lists);
  } catch (error) {
    console.error("Error in getUserLists:", error);
    res.status(500).json({ error: "Failed to fetch lists" });
  }
};

export const addMovieToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { movieId } = req.body;
    const userId = req.user.userId;

    if (!movieId) {
      return res.status(400).json({ error: "Movie ID required" });
    }

    const list = await List.findOne({ _id: listId, userId });

    if (!list) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const item = await ListItem.create({
      listId,
      movieId,
    });

    // Invalidate list caches
    await delCache(`list:${listId}:movies`, `list:public:${listId}`);

    res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Movie already in list" });
    }
    res.status(500).json({ error: "Failed to add movie" });
  }
};
export const getListMovies = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.userId;

    const list = await List.findOne({ _id: listId, userId });

    if (!list) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const cacheKey = `list:${listId}:movies`;
    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const movies = await ListItem.find({ listId });

    await setCache(cacheKey, movies, LISTS_TTL);

    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch list movies" });
  }
};

export const getPublicListDetails = async (req, res) => {
  try {
    const { listId } = req.params;

    const cacheKey = `list:public:${listId}`;
    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const list = await List.findById(listId).select("_id name");

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    const movies = await ListItem.find({ listId: list._id }).select("movieId");

    const response = { list, movies };

    await setCache(cacheKey, response, PUBLIC_LIST_TTL);

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch public list" });
  }
};

export const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.userId;

    const list = await List.findOne({ _id: listId, userId });

    if (!list) {
      return res
        .status(403)
        .json({ error: "Not authorized or list not found" });
    }

    await ListItem.deleteMany({ listId });

    await List.deleteOne({ _id: listId });

    // Invalidate all related caches
    await delCache(
      `user:${userId}:lists`,
      `list:${listId}:movies`,
      `list:public:${listId}`,
    );

    res.json({ message: "List deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete list" });
  }
};

export const removeMovieFromList = async (req, res) => {
  try {
    const { listId, movieId } = req.params;
    const userId = req.user.userId;

    const list = await List.findOne({ _id: listId, userId });

    if (!list) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const deleted = await ListItem.findOneAndDelete({
      listId,
      movieId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Movie not found in this list" });
    }

    // Invalidate list caches
    await delCache(`list:${listId}:movies`, `list:public:${listId}`);

    res.json({ message: "Movie removed from list" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove movie" });
  }
};
