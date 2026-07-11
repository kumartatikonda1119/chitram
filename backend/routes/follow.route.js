import express from "express";
import { protect } from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from "../controllers/follow.controller.js";

const router = express.Router();

router.post("/:userId", protect, followUser);
router.delete("/:userId", protect, unfollowUser);
router.get("/status/:userId", protect, getFollowStatus);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/requests", protect, getFollowRequests);
router.put("/requests/:requestId/accept", protect, acceptFollowRequest);
router.delete("/requests/:requestId/reject", protect, rejectFollowRequest);

export default router;
