import { getPersonalizedRecommendations } from "../services/recommendation.service.js";
import { getRecentInteractions } from "../services/interaction.service.js";
import { getCache, setCache } from "../services/redis.service.js";
import fetch from "node-fetch";

const TMDB_API_KEY = process.env.API_KEY;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Fetch with a timeout to prevent hanging inside Docker.
 */
const fetchWithTimeout = async (url, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

export const getPersonalized = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = req.query.page || 1;

    const recommendations = await getPersonalizedRecommendations(userId, page);

    // Ensure we always return a valid shape even if something went wrong
    const safeResponse = {
      results: recommendations?.results || [],
      page: recommendations?.page || Number(page),
      total_pages: recommendations?.total_pages || 1,
      total_results: recommendations?.total_results || 0,
    };

    res.status(200).json(safeResponse);
  } catch (error) {
    console.error("Error in getPersonalized:", error);
    // Return empty results instead of a 500 error so the frontend doesn't crash
    res.status(200).json({
      results: [],
      page: 1,
      total_pages: 1,
      total_results: 0,
      _error: "Failed to fetch personalized recommendations",
    });
  }
};

export const getRecentlyViewedMovies = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = req.query.limit || 20;

    // Only fetch view_movie interactions for "recently viewed"
    const recent = await getRecentInteractions(userId, 100);

    // Filter for actual movie views only (not favorites, list adds, etc.) and deduplicate
    const VIEWED_ACTIONS = new Set(["view_movie", "view_series"]);
    const uniqueMovieIds = new Set();
    const movieIds = [];

    for (const interaction of recent) {
      if (
        VIEWED_ACTIONS.has(interaction.action) &&
        interaction.targetType === "movie" &&
        !uniqueMovieIds.has(interaction.targetId)
      ) {
        uniqueMovieIds.add(interaction.targetId);
        movieIds.push(interaction.targetId);
        if (movieIds.length >= limit) break;
      }
    }

    if (movieIds.length === 0) {
      return res.status(200).json({
        page: 1,
        results: [],
        total_pages: 1,
        total_results: 0,
      });
    }

    // Hydrate from TMDB with Redis Cache — with timeout and batching
    const hydrateMovie = async (id) => {
      const cacheKey = `tmdb:mini:movie:${id}`;
      let data = await getCache(cacheKey);
      if (data) return data;

      try {
        const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`;
        const response = await fetchWithTimeout(url);
        if (response.ok) {
          data = await response.json();
          await setCache(cacheKey, data, 86400);
          return data;
        }
      } catch (err) {
        console.warn(`Recently viewed: Failed to hydrate movie ${id}:`, err.message);
      }
      return null;
    };

    // Fetch in batches of 5 to avoid TMDB rate limits
    const movies = [];
    for (let i = 0; i < movieIds.length; i += 5) {
      const batch = movieIds.slice(i, i + 5);
      const results = await Promise.all(batch.map(hydrateMovie));
      movies.push(...results.filter(Boolean));
    }

    res.status(200).json({
      page: 1,
      results: movies,
      total_pages: 1,
      total_results: movies.length,
    });
  } catch (error) {
    console.error("Error in getRecentlyViewedMovies:", error);
    // Return empty results instead of a 500 so the frontend doesn't crash
    res.status(200).json({
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
      _error: "Failed to fetch recently viewed",
    });
  }
};
