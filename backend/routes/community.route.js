import express from "express";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import {
  getFeed,
  getGlobalFeed,
  getTrendingReviews,
} from "../controllers/community.controller.js";

const router = express.Router();

router.get("/feed", protect, getFeed);
router.get("/global", optionalAuth, getGlobalFeed);
router.get("/trending-reviews", optionalAuth, getTrendingReviews);

export default router;
