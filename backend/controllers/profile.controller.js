import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import List from "../models/list.model.js";
import Follow from "../models/follow.model.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "username email avatar isPublic bio createdAt",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reviewCount = await Review.countDocuments({ userId });

    const ratingAgg = await Review.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId, status: "accepted" }),
      Follow.countDocuments({ followerId: userId, status: "accepted" }),
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPublic: user.isPublic,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      stats: {
        reviewCount,
        averageRating: ratingAgg[0]?.avg
          ? parseFloat(ratingAgg[0].avg.toFixed(1))
          : 0,
        followerCount,
        followingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bio, isPublic } = req.body;

    const updateFields = {};

    if (bio !== undefined) {
      if (bio.length > 500) {
        return res
          .status(400)
          .json({ error: "Bio must be under 500 characters" });
      }
      updateFields.bio = bio.trim();
    }

    if (isPublic !== undefined) {
      updateFields.isPublic = Boolean(isPublic);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    }).select("username email avatar isPublic bio createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isPublic: user.isPublic,
      bio: user.bio,
      authProviders: user.authProviders,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    }).select("username avatar isPublic bio createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isPublic) {
      return res.status(403).json({
        error: "This profile is private",
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          isPublic: false,
        },
      });
    }

    // Fetch review stats
    const reviewCount = await Review.countDocuments({ userId: user._id });
    const ratingAgg = await Review.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    // Fetch all user lists (privacy is profile-level, not list-level)
    const lists = await List.find({
      userId: user._id,
    }).select("name createdAt");

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: user._id, status: "accepted" }),
      Follow.countDocuments({ followerId: user._id, status: "accepted" }),
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        isPublic: true,
      },
      stats: {
        reviewCount,
        averageRating: ratingAgg[0]?.avg
          ? parseFloat(ratingAgg[0].avg.toFixed(1))
          : 0,
        followerCount,
        followingCount,
      },
      lists,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// GET /api/profile/search?q=keyword — search public users by username
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: "i" },
      isPublic: true,
    })
      .select("username avatar bio")
      .limit(20);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
      })),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};
