import fetch from "node-fetch";
import Interaction from "../models/interaction.model.js";
import { getCache, setCache } from "./redis.service.js";

const TMDB_API_KEY = process.env.API_KEY;
const MAX_INTERACTIONS = 100;
const MOVIE_CACHE_TTL = 86400; // 24 hours
const PROFILE_CACHE_TTL = 300; // 5 minutes
const FETCH_TIMEOUT_MS = 8000; // 8 seconds

// Scoring weights for different interaction types
const SCORES = {
  view_movie: 1,
  view_series: 1,
  view_person: 2,
  add_to_list: 20,
  add_favorite: 25,
  explore_section: 2,
  search: 3,
};

// Actions that actually contribute meaningful signal for recommendations
const MEANINGFUL_ACTIONS = new Set([
  "view_movie",
  "view_series",
  "view_person",
  "add_to_list",
  "add_favorite",
  "search",
]);

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

/**
 * Fetch basic movie/tv details from TMDB, using Redis caching.
 */
const fetchTMDBDetails = async (targetType, targetId) => {
  if (!["movie", "tv", "person"].includes(targetType)) return null;

  const cacheKey = `tmdb:mini:${targetType}:${targetId}`;
  let data = await getCache(cacheKey);

  if (!data) {
    try {
      const url = `https://api.themoviedb.org/3/${targetType}/${targetId}?api_key=${TMDB_API_KEY}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) return null;
      data = await res.json();
      await setCache(cacheKey, data, MOVIE_CACHE_TTL);
    } catch (err) {
      // AbortError means timeout — log but don't crash
      if (err.name === "AbortError") {
        console.warn(`TMDB fetch timeout for ${targetType}/${targetId}`);
      } else {
        console.error(`Failed to fetch TMDB details for ${targetType} ${targetId}`, err.message);
      }
      return null;
    }
  }
  return data;
};

/**
 * Generate a personalized recommendation profile based on the last N interactions.
 */
export const buildUserProfile = async (userId) => {
  // Check cache first
  const profileCacheKey = `reco:profile:${userId}`;
  const cachedProfile = await getCache(profileCacheKey);
  if (cachedProfile) {
    return cachedProfile;
  }

  const interactions = await Interaction.find({
    userId,
    action: { $in: Array.from(MEANINGFUL_ACTIONS) },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_INTERACTIONS);

  if (!interactions.length) {
    return null;
  }

  const profile = {
    genres: {},
    languages: {},
    people: {}, // actors, directors
  };

  // Add score utility
  const addScore = (category, id, score) => {
    if (!id) return;
    profile[category][id] = (profile[category][id] || 0) + score;
  };

  // Batch fetch TMDB details for movies and series
  // We use a Map to avoid redundant fetches
  const mediaToFetch = new Map(); // "type_id" -> { targetType, targetId }

  interactions.forEach((interaction) => {
    if (["movie", "tv"].includes(interaction.targetType)) {
      mediaToFetch.set(`${interaction.targetType}_${interaction.targetId}`, {
        targetType: interaction.targetType,
        targetId: interaction.targetId,
      });
    }
  });

  const mediaDetails = new Map(); // "type_id" -> TMDB data

  // Fetch in batches of 5 to avoid TMDB rate limits
  const items = Array.from(mediaToFetch.values());
  for (let i = 0; i < items.length; i += 5) {
    const batch = items.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (item) => {
        const data = await fetchTMDBDetails(item.targetType, item.targetId);
        return { key: `${item.targetType}_${item.targetId}`, data };
      })
    );
    results.forEach(({ key, data }) => {
      if (data) mediaDetails.set(key, data);
    });
  }

  // Calculate scores
  interactions.forEach((interaction) => {
    const score = SCORES[interaction.action] || 1;

    // If it's a person view
    if (interaction.targetType === "person") {
      addScore("people", interaction.targetId, score);
    }

    // If it's a movie/tv, extract genres and languages from hydrated data
    if (["movie", "tv"].includes(interaction.targetType)) {
      const data = mediaDetails.get(`${interaction.targetType}_${interaction.targetId}`);
      if (data) {
        // Original Language
        if (data.original_language) {
          addScore("languages", data.original_language, score);
        }

        // Genres
        if (data.genres && Array.isArray(data.genres)) {
          data.genres.forEach((g) => addScore("genres", g.id, score));
        }
      }
    }
  });

  // Extract Top 3 Genres, Top 1 Language, Top 2 People
  const getTop = (obj, limit) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((entry) => entry[0]);
  };

  const result = {
    topGenres: getTop(profile.genres, 3),
    topLanguages: getTop(profile.languages, 1),
    topPeople: getTop(profile.people, 2),
  };

  // Cache the profile for 5 minutes
  await setCache(profileCacheKey, result, PROFILE_CACHE_TTL);

  return result;
};

/**
 * Get personalized recommendations for a user.
 */
export const getPersonalizedRecommendations = async (userId, page = 1) => {
  const profile = await buildUserProfile(userId);

  // Fallback to trending if no meaningful profile exists
  if (
    !profile ||
    (profile.topGenres.length === 0 &&
      profile.topLanguages.length === 0 &&
      profile.topPeople.length === 0)
  ) {
    console.log(`[Reco] No profile for user ${userId}, falling back to trending`);
    return fetchTrending(page);
  }

  console.log(`[Reco] User ${userId} profile:`, JSON.stringify(profile));

  // Strategy: Try progressively relaxed queries
  // 1. Genres + Language + People (strictest)
  // 2. Genres + Language
  // 3. Genres only
  // 4. Trending fallback

  const strategies = [];

  // Strategy 1: Full profile
  if (profile.topGenres.length > 0) {
    const params = {
      api_key: TMDB_API_KEY,
      sort_by: "popularity.desc",
      page: String(page),
      "vote_count.gte": "50",
      with_genres: profile.topGenres.join(","),
    };

    if (profile.topLanguages.length > 0) {
      params.with_original_language = profile.topLanguages[0];
    }

    if (profile.topPeople.length > 0) {
      params.with_people = profile.topPeople.join(",");
    }

    strategies.push(new URLSearchParams(params));
  }

  // Strategy 2: Genres + Language (no people)
  if (profile.topGenres.length > 0 && profile.topLanguages.length > 0) {
    strategies.push(
      new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: "popularity.desc",
        page: String(page),
        "vote_count.gte": "50",
        with_genres: profile.topGenres.join(","),
        with_original_language: profile.topLanguages[0],
      })
    );
  }

  // Strategy 3: Genres only
  if (profile.topGenres.length > 0) {
    strategies.push(
      new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: "popularity.desc",
        page: String(page),
        "vote_count.gte": "20",
        with_genres: profile.topGenres.join(","),
      })
    );
  }

  // Try each strategy until we get enough results
  for (let i = 0; i < strategies.length; i++) {
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?${strategies[i].toString()}`;
      console.log(`[Reco] Strategy ${i + 1}: ${url}`);
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results && data.results.length >= 5) {
        console.log(`[Reco] Strategy ${i + 1} returned ${data.results.length} results`);
        return data;
      }
      console.log(`[Reco] Strategy ${i + 1} returned only ${data.results?.length || 0} results, trying next`);
    } catch (err) {
      console.warn(`[Reco] Strategy ${i + 1} failed:`, err.message);
    }
  }

  // Ultimate fallback to trending
  console.log(`[Reco] All strategies exhausted, falling back to trending`);
  return fetchTrending(page);
};

/**
 * Fetch trending movies as a fallback.
 */
const fetchTrending = async (page = 1) => {
  try {
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&page=${page}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return { results: [], page: 1, total_pages: 1, total_results: 0 };
    }
    return await res.json();
  } catch (err) {
    console.error("[Reco] Trending fallback failed:", err.message);
    return { results: [], page: 1, total_pages: 1, total_results: 0 };
  }
};
