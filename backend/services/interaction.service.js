import Interaction from "../models/interaction.model.js";

/**
 * Record a user interaction. Fire-and-forget — errors are logged
 * but never propagated so tracking can never break primary operations.
 */
export const trackInteraction = async (
  userId,
  action,
  targetType,
  targetId,
  metadata = {},
) => {
  try {
    await Interaction.create({
      userId,
      action,
      targetType,
      targetId: String(targetId),
      metadata,
    });
  } catch (error) {
    console.error("Interaction tracking failed:", error.message);
  }
};

/**
 * Retrieve a user's interactions with optional filters.
 * @param {string} userId
 * @param {object} filters - { action, targetType, limit, page }
 */
export const getUserInteractions = async (userId, filters = {}) => {
  const { action, targetType, limit = 20, page = 1 } = filters;

  const query = { userId };
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;

  const skip = (page - 1) * limit;

  const [interactions, total] = await Promise.all([
    Interaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Interaction.countDocuments(query),
  ]);

  return {
    interactions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get the most recent interactions for a user.
 * Useful for "recently viewed" features.
 */
export const getRecentInteractions = async (userId, limit = 10) => {
  return Interaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Number(limit));
};
