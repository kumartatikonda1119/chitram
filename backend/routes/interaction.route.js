import express from "express";
import { protect } from "../middleware/auth.js";
import {
  track,
  getInteractions,
  getRecent,
} from "../controllers/interaction.controller.js";

const router = express.Router();

router.post("/", protect, track);
router.get("/", protect, getInteractions);
router.get("/recent", protect, getRecent);

export default router;
