import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../controllers/favourite.controller.js";

const router = express.Router();

router.post("/addFavorite", protect, addFavorite);
router.delete("/removeFavorite/:movieId", protect, removeFavorite);
router.get("/getFavorites", protect, getFavorites);

export default router;
