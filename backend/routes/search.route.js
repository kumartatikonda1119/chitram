import express from "express";
import {
  exploreMovies,
  searchActor,
  searchDirector,
  searchMovie,
  searchPerson,
  searchMovieByGenre,
  searchMovieById,
} from "../controllers/search.controller.js";
const router = express.Router();
router.get("/exploreMovies", exploreMovies);
router.get("/searchMovie", searchMovie);
router.get("/searchPerson", searchPerson);
router.get("/searchActor", searchActor);
router.get("/searchDirector", searchDirector);
router.get("/searchMovieByGenre", searchMovieByGenre);
router.get("/searchMovie/:id", searchMovieById);
export default router;
