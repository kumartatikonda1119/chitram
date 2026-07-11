import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";

// POST /api/follow/:userId — follow a user
export const followUser = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userId: followingId } = req.params;

    if (followerId === followingId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(followingId).select(
      "username avatar isPublic",
    );
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following or pending
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      return res.status(400).json({
        error:
          existing.status === "pending"
            ? "Follow request already sent"
            : "Already following this user",
        status: existing.status,
      });
    }

    // Public profile → instant follow; Private → pending request
    const status = targetUser.isPublic ? "accepted" : "pending";

    await Follow.create({ followerId, followingId, status });

    // Create activity for accepted follows
    if (status === "accepted") {
      await Activity.create({
        userId: followerId,
        type: "started_following",
        refId: followingId,
        meta: {
          targetUsername: targetUser.username,
          targetAvatar: targetUser.avatar,
        },
      });
    }

    res.status(201).json({ status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Already following this user" });
    }
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// DELETE /api/follow/:userId — unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userId: followingId } = req.params;

    const result = await Follow.findOneAndDelete({ followerId, followingId });
    if (!result) {
      return res.status(404).json({ error: "Not following this user" });
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

// GET /api/follow/status/:userId — check follow status
export const getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userId: followingId } = req.params;

    const follow = await Follow.findOne({ followerId, followingId });

    res.json({
      isFollowing: follow?.status === "accepted",
      isPending: follow?.status === "pending",
      status: follow?.status || "none",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check follow status" });
  }
};

// GET /api/follow/followers/:userId — get user's followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await Follow.find({
      followingId: userId,
      status: "accepted",
    })
      .populate("followerId", "username avatar")
      .sort({ createdAt: -1 });

    res.json({
      followers: followers.map((f) => ({
        id: f.followerId._id,
        username: f.followerId.username,
        avatar: f.followerId.avatar,
        followedAt: f.createdAt,
      })),
      count: followers.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch followers" });
  }
};

// GET /api/follow/following/:userId — get users this person follows
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const following = await Follow.find({
      followerId: userId,
      status: "accepted",
    })
      .populate("followingId", "username avatar")
      .sort({ createdAt: -1 });

    res.json({
      following: following.map((f) => ({
        id: f.followingId._id,
        username: f.followingId.username,
        avatar: f.followingId.avatar,
        followedAt: f.createdAt,
      })),
      count: following.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch following" });
  }
};

// GET /api/follow/requests — get pending follow requests for current user
export const getFollowRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await Follow.find({
      followingId: userId,
      status: "pending",
    })
      .populate("followerId", "username avatar")
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        userId: r.followerId._id,
        username: r.followerId.username,
        avatar: r.followerId.avatar,
        requestedAt: r.createdAt,
      })),
      count: requests.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch follow requests" });
  }
};

// PUT /api/follow/requests/:requestId/accept
export const acceptFollowRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await Follow.findOneAndUpdate(
      { _id: requestId, followingId: userId, status: "pending" },
      { status: "accepted" },
      { new: true },
    ).populate("followerId", "username avatar");

    if (!request) {
      return res.status(404).json({ error: "Follow request not found" });
    }

    // Create activity
    await Activity.create({
      userId: request.followerId._id,
      type: "started_following",
      refId: userId,
      meta: {
        targetUsername: req.user.username,
        targetAvatar: req.user.avatar,
      },
    });

    res.json({ message: "Follow request accepted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept follow request" });
  }
};

// DELETE /api/follow/requests/:requestId/reject
export const rejectFollowRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const result = await Follow.findOneAndDelete({
      _id: requestId,
      followingId: userId,
      status: "pending",
    });

    if (!result) {
      return res.status(404).json({ error: "Follow request not found" });
    }

    res.json({ message: "Follow request rejected" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject follow request" });
  }
};
