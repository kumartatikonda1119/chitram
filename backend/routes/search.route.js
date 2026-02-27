import express from "express";
import {
  exploreMovies,
  searchActor,
  searchDirector,
  searchMovie,
  searchPerson,
  searchMovieByGenre,
  searchMovieById,
  searchSeriesByName,
  searchSeriesById,
  searchSeason,
  searchEpisode,
} from "../controllers/search.controller.js";
const router = express.Router();
router.get("/exploreMovies", exploreMovies);
router.get("/searchMovie", searchMovie);
router.get("/searchPerson", searchPerson);
router.get("/searchActor", searchActor);
router.get("/searchDirector", searchDirector);
router.get("/searchMovieByGenre", searchMovieByGenre);
router.get("/searchMovie/:id", searchMovieById);
router.get("/searchSeries/:id", searchSeriesById);
router.get("/searchSeriesById/:id", searchSeriesById);
router.get("/searchSeriesById", searchSeriesById);
router.get("/searchSeriesByName", searchSeriesByName);
router.get("/searchSeries/:seriesId/season/:seasonNo", searchSeason);
router.get(
  "/searchSeries/:seriesId/season/:seasonNo/episode/:episodeId",
  searchEpisode,
);
export default router;
