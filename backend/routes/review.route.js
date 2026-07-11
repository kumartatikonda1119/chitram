import express from "express";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import {
  createReview,
  updateReview,
  deleteReview,
  getContentReviews,
  getUserReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

// Protected routes (require login)
router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

// Public routes (optionalAuth to identify current user)
router.get("/content/:targetType/:targetId", optionalAuth, getContentReviews);
router.get("/user/:userId", optionalAuth, getUserReviews);

export default router;
