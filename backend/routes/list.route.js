import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createList,
  getUserLists,
  addMovieToList,
  getListMovies,
  deleteList,
} from "../controllers/list.controller.js";

const router = express.Router();

router.get("/", protect, getUserLists);
router.post("/", protect, createList);
router.post("/:listId/movie", protect, addMovieToList);
router.get("/:listId", protect, getListMovies);
router.delete("/:listId", protect, deleteList);

export default router;
