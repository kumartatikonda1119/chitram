import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  searchUsers,
} from "../controllers/profile.controller.js";

const router = express.Router();

// Protected routes (own profile)
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// Search users (must be before /:username)
router.get("/search", searchUsers);

// Public route (view other user's profile by username)
router.get("/:username", getPublicProfile);

export default router;
