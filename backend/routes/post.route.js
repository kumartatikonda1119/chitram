import express from "express";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import {
  createPost,
  getPosts,
  getUserPosts,
  deletePost,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", protect, createPost);
router.get("/", optionalAuth, getPosts);
router.get("/user/:userId", getUserPosts);
router.delete("/:postId", protect, deletePost);

// Comment routes
router.post("/:postId/comments", protect, addComment);
router.get("/:postId/comments", getComments);
router.delete("/comments/:commentId", protect, deleteComment);

export default router;
