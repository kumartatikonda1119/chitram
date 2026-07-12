import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Activity from "../models/activity.model.js";

// POST /api/posts — create a new post
export const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, taggedMovies } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Post content is required" });
    }

    if (content.length > 2000) {
      return res
        .status(400)
        .json({ error: "Post must be under 2000 characters" });
    }

    const post = await Post.create({
      userId,
      content: content.trim(),
      taggedMovies: (taggedMovies || []).slice(0, 5), // Max 5 tagged movies
    });

    const populated = await Post.findById(post._id).populate(
      "userId",
      "username avatar isPublic",
    );

    res.status(201).json(populated);

    // Generate feed activity (fire-and-forget)
    Activity.create({
      userId,
      type: "post_created",
      refId: post._id.toString(),
      meta: {
        contentPreview: content.trim().substring(0, 200),
        taggedMovies: (taggedMovies || []).slice(0, 3).map((m) => ({
          tmdbId: m.tmdbId,
          title: m.title,
          type: m.type,
          poster: m.poster,
        })),
      },
    }).catch((err) => console.error("Activity creation failed:", err));
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// GET /api/posts — get global posts (from public profiles)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalCount = await Post.countDocuments({});

    const posts = await Post.find({})
      .populate("userId", "username avatar isPublic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Discussions are public conversations — show all posts
    // Profile privacy only hides the profile page, not community posts

    // Attach comment counts
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(commentCounts.map((c) => [c._id.toString(), c.count]));
    const postsWithCounts = posts.map((p) => ({
      ...p,
      commentCount: countMap[p._id.toString()] || 0,
    }));

    res.json({
      posts: postsWithCounts,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// GET /api/posts/user/:userId — get posts by a specific user
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId })
      .populate("userId", "username avatar isPublic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Post.countDocuments({ userId });

    res.json({
      posts,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// DELETE /api/posts/:postId — delete own post
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    const post = await Post.findOneAndDelete({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Clean up activity
    Activity.deleteOne({
      userId,
      type: "post_created",
      refId: postId,
    }).catch(() => {});

    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// POST /api/posts/:postId/comments — add a reply/comment to a post
export const addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await Comment.create({
      postId,
      userId,
      content: content.trim(),
    });

    const populated = await Comment.findById(comment._id).populate(
      "userId",
      "username avatar",
    );

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// GET /api/posts/:postId/comments — get comments for a post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .populate("userId", "username avatar")
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// DELETE /api/posts/comments/:commentId — delete own comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { commentId } = req.params;

    const comment = await Comment.findOneAndDelete({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
