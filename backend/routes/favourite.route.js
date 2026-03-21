import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../controllers/favourite.controller.js";

const router = express.Router();

router.get("/getFavorites", protect, getFavorites);
router.post("/addFavorite", protect, addFavorite);
router.delete("/removeFavorite/:movieId", protect, removeFavorite);

export default router;
