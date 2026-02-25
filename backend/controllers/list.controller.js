import ListItem from "../models/listItem.model.js";
import List from "../models/list.model.js";

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

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to create list" });
  }
};

export const getUserLists = async (req, res) => {
  try {
    const userId = req.user.userId;
    const lists = await List.find({ userId });

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

    const movies = await ListItem.find({ listId });

    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch list movies" });
  }
};

export const updateListVisibility = async (req, res) => {
  try {
    const { listId } = req.params;
    const { isPublic } = req.body;
    const userId = req.user.userId;

    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ error: "isPublic must be a boolean" });
    }

    const list = await List.findOneAndUpdate(
      { _id: listId, userId },
      { isPublic },
      { new: true },
    );

    if (!list) {
      return res
        .status(403)
        .json({ error: "Not authorized or list not found" });
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to update list visibility" });
  }
};

export const getPublicListDetails = async (req, res) => {
  try {
    const { listId } = req.params;

    const list = await List.findById(listId).select("_id name isPublic");

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    if (!list.isPublic) {
      return res.status(403).json({ error: "This list is private" });
    }

    const movies = await ListItem.find({ listId: list._id }).select("movieId");

    res.json({
      list,
      movies,
    });
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

    res.json({ message: "Movie removed from list" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove movie" });
  }
};
