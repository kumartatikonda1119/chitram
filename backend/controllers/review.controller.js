import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId, targetType, rating, content, targetTitle, targetPoster } =
      req.body;

    if (!targetId || !targetType || !rating || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!["movie", "tv"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (content.length > 5000) {
      return res
        .status(400)
        .json({ error: "Review must be under 5000 characters" });
    }

    const existing = await Review.findOne({ userId, targetId, targetType });
    if (existing) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this title" });
    }

    const review = await Review.create({
      userId,
      targetId,
      targetType,
      rating,
      content: content.trim(),
      targetTitle: targetTitle || "",
      targetPoster: targetPoster || "",
    });

    // Populate author info for the response
    const populated = await Review.findById(review._id).populate(
      "userId",
      "username avatar isPublic",
    );

    res.status(201).json(populated);

    // Generate feed activity (fire-and-forget)
    Activity.create({
      userId,
      type: "review_created",
      refId: review._id.toString(),
      meta: {
        targetId,
        targetType,
        targetTitle: targetTitle || "",
        targetPoster: targetPoster || "",
        rating,
        contentPreview: content.trim().substring(0, 200),
      },
    }).catch((err) => console.error("Activity creation failed:", err));
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this title" });
    }
    res.status(500).json({ error: "Failed to create review" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, content } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own reviews" });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }
      review.rating = rating;
    }

    if (content !== undefined) {
      if (content.length > 5000) {
        return res
          .status(400)
          .json({ error: "Review must be under 5000 characters" });
      }
      review.content = content.trim();
    }

    await review.save();

    const populated = await Review.findById(review._id).populate(
      "userId",
      "username avatar isPublic",
    );

    res.json(populated);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own reviews" });
    }

    await Review.deleteOne({ _id: reviewId });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

export const getContentReviews = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!["movie", "tv"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ targetId, targetType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username avatar isPublic"),
      Review.countDocuments({ targetId, targetType }),
    ]);

    // If user is logged in, flag which review is theirs
    const currentUserId = req.user?.userId || null;

    const results = reviews.map((r) => {
      const obj = r.toObject();
      obj.isOwn = currentUserId && r.userId?._id?.toString() === currentUserId;
      return obj;
    });

    // Move own review to top if it exists
    results.sort((a, b) => {
      if (a.isOwn && !b.isOwn) return -1;
      if (!a.isOwn && b.isOwn) return 1;
      return 0;
    });

    res.json({
      reviews: results,
      page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
    });
  } catch (error) {
    console.error("Error fetching content reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check if user exists and if profile is public
    const targetUser = await User.findById(userId).select("isPublic username");
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Allow own reviews regardless of privacy
    const currentUserId = req.user?.userId || null;
    const isOwner = currentUserId === userId;

    if (!targetUser.isPublic && !isOwner) {
      return res.status(403).json({ error: "This user's profile is private" });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ userId }),
    ]);

    res.json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
};
