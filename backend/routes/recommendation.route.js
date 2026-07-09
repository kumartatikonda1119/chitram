import express from "express";
import { protect } from "../middleware/auth.js";
import { getPersonalized, getRecentlyViewedMovies } from "../controllers/recommendation.controller.js";

const router = express.Router();

router.get("/personalized", protect, getPersonalized);
router.get("/recently-viewed", protect, getRecentlyViewedMovies);

export default router;
