import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createList,
  getUserLists,
  addMovieToList,
  getListMovies,
  deleteList,
  getPublicListDetails,
  removeMovieFromList,
} from "../controllers/list.controller.js";

const router = express.Router();

router.get("/", protect, getUserLists);
router.get("/public/:listId", getPublicListDetails);
router.post("/", protect, createList);
router.post("/:listId/movie", protect, addMovieToList);
router.get("/:listId", protect, getListMovies);
router.delete("/:listId", protect, deleteList);
router.delete("/:listId/movie/:movieId", protect, removeMovieFromList);
export default router;
