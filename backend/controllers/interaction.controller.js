import {
  trackInteraction,
  getUserInteractions,
  getRecentInteractions,
} from "../services/interaction.service.js";

export const track = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { action, targetType, targetId, metadata } = req.body;

    if (!action || !targetType || !targetId) {
      return res
        .status(400)
        .json({ error: "action, targetType, and targetId are required" });
    }

    await trackInteraction(userId, action, targetType, targetId, metadata);

    res.status(201).json({ message: "Interaction recorded" });
  } catch (error) {
    console.error("Error in track controller:", error);
    res.status(500).json({ error: "Failed to record interaction" });
  }
};

export const getInteractions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { action, targetType, limit, page } = req.query;

    const result = await getUserInteractions(userId, {
      action,
      targetType,
      limit,
      page,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in getInteractions:", error);
    res.status(500).json({ error: "Failed to fetch interactions" });
  }
};

export const getRecent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit } = req.query;

    const interactions = await getRecentInteractions(userId, limit);

    res.json({ interactions });
  } catch (error) {
    console.error("Error in getRecent:", error);
    res.status(500).json({ error: "Failed to fetch recent interactions" });
  }
};
