import Follow from "../models/follow.model.js";
import Activity from "../models/activity.model.js";
import Review from "../models/review.model.js";

// GET /api/community/feed — personalized feed from followed users
export const getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get list of users the current user follows
    const following = await Follow.find({
      followerId: userId,
      status: "accepted",
    }).select("followingId");

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return res.json({
        feed: [],
        page,
        totalPages: 0,
        message: "Follow users to see their activity here!",
      });
    }

    const totalCount = await Activity.countDocuments({
      userId: { $in: followingIds },
    });

    const activities = await Activity.find({
      userId: { $in: followingIds },
    })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      feed: activities.map((a) => ({
        id: a._id,
        type: a.type,
        user: {
          id: a.userId._id,
          username: a.userId.username,
          avatar: a.userId.avatar,
        },
        refId: a.refId,
        meta: a.meta,
        createdAt: a.createdAt,
      })),
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

// GET /api/community/global — global feed of recent activity (for discovery)
export const getGlobalFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalCount = await Activity.countDocuments({
      type: { $in: ["review_created", "post_created", "list_created"] },
    });

    const activities = await Activity.find({
      type: { $in: ["review_created", "post_created", "list_created"] },
    })
      .populate("userId", "username avatar isPublic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Only show activities from public profiles
    const publicActivities = activities.filter((a) => a.userId?.isPublic);

    res.json({
      feed: publicActivities.map((a) => ({
        id: a._id,
        type: a.type,
        user: {
          id: a.userId._id,
          username: a.userId.username,
          avatar: a.userId.avatar,
        },
        refId: a.refId,
        meta: a.meta,
        createdAt: a.createdAt,
      })),
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching global feed:", error);
    res.status(500).json({ error: "Failed to fetch global feed" });
  }
};

// GET /api/community/trending-reviews — recent reviews with high ratings
export const getTrendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("userId", "username avatar isPublic")
      .sort({ createdAt: -1 })
      .limit(20);

    // Only show from public profiles
    const publicReviews = reviews.filter((r) => r.userId?.isPublic);

    res.json({
      reviews: publicReviews.map((r) => ({
        id: r._id,
        rating: r.rating,
        content: r.content,
        targetId: r.targetId,
        targetType: r.targetType,
        targetTitle: r.targetTitle,
        targetPoster: r.targetPoster,
        user: {
          id: r.userId._id,
          username: r.userId.username,
          avatar: r.userId.avatar,
        },
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching trending reviews:", error);
    res.status(500).json({ error: "Failed to fetch trending reviews" });
  }
};
