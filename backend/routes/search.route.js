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
  getOTTProviders,
  getSeriesOTTProviders,
  smartSearch,
  autocomplete,
} from "../controllers/search.controller.js";
import { cacheRoute } from "../middleware/cache.js";

const router = express.Router();

// AI-powered endpoints
router.post("/smart", smartSearch);
router.get(
  "/autocomplete",
  cacheRoute((req) => `autocomplete:${(req.query.q || "").trim().toLowerCase()}`, 1800),
  autocomplete,
);

router.get(
  "/exploreMovies",
  cacheRoute(
    (req) =>
      `tmdb:explore:${req.query.section || "trending"}:${req.query.page || 1}`,
    600,
  ),
  exploreMovies,
);

router.get(
  "/searchMovie",
  cacheRoute(
    (req) =>
      `tmdb:search:movie:${req.query.movie}:${req.query.lang || "all"}`,
    1800,
  ),
  searchMovie,
);

router.get(
  "/searchPerson",
  cacheRoute((req) => `tmdb:search:person:${req.query.name}`, 3600),
  searchPerson,
);

router.get(
  "/searchActor",
  cacheRoute((req) => `tmdb:actor:${req.query.actorid}`, 3600),
  searchActor,
);

router.get(
  "/searchDirector",
  cacheRoute((req) => `tmdb:director:${req.query.directorid}`, 3600),
  searchDirector,
);

router.get(
  "/searchMovieByGenre",
  cacheRoute(
    (req) => `tmdb:genre:${req.query.id}:${req.query.lang || "all"}`,
    900,
  ),
  searchMovieByGenre,
);

router.get(
  "/searchMovie/:id",
  cacheRoute((req) => `tmdb:movie:${req.params.id}`, 3600),
  searchMovieById,
);

router.get(
  "/searchSeries/:id",
  cacheRoute((req) => `tmdb:series:${req.params.id}`, 3600),
  searchSeriesById,
);

router.get(
  "/searchSeriesById/:id",
  cacheRoute((req) => `tmdb:series:${req.params.id}`, 3600),
  searchSeriesById,
);

router.get(
  "/searchSeriesById",
  cacheRoute((req) => `tmdb:series:${req.query.id}`, 3600),
  searchSeriesById,
);

router.get(
  "/searchSeriesByName",
  cacheRoute((req) => `tmdb:search:series:${req.query.name}`, 1800),
  searchSeriesByName,
);

router.get(
  "/searchSeries/:seriesId/season/:seasonNo",
  cacheRoute(
    (req) =>
      `tmdb:series:${req.params.seriesId}:season:${req.params.seasonNo}`,
    3600,
  ),
  searchSeason,
);

router.get(
  "/searchSeries/:seriesId/season/:seasonNo/episode/:episodeId",
  cacheRoute(
    (req) =>
      `tmdb:series:${req.params.seriesId}:s${req.params.seasonNo}:e${req.params.episodeId}`,
    3600,
  ),
  searchEpisode,
);

router.get(
  "/getOTTProvider/:id",
  cacheRoute((req) => `tmdb:ott:movie:${req.params.id}`, 21600),
  getOTTProviders,
);

router.get(
  "/getSeriesOTTProvider/:id",
  cacheRoute((req) => `tmdb:ott:series:${req.params.id}`, 21600),
  getSeriesOTTProviders,
);

export default router;
