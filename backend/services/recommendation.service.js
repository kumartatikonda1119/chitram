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
      const appendParams = ["movie", "tv"].includes(targetType) ? "&append_to_response=credits" : "";
      const url = `https://api.themoviedb.org/3/${targetType}/${targetId}?api_key=${TMDB_API_KEY}${appendParams}`;
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

        // Actors & Directors (from credits)
        if (data.credits) {
          // Add top 5 actors (lead roles matter most)
          if (data.credits.cast && Array.isArray(data.credits.cast)) {
            data.credits.cast.slice(0, 5).forEach((actor, idx) => {
              // Lead actors get higher score, supporting actors get less
              const actorBonus = idx < 2 ? score : score * 0.5;
              addScore("people", actor.id, actorBonus);
            });
          }
          // Add director(s)
          if (data.credits.crew && Array.isArray(data.credits.crew)) {
            data.credits.crew
              .filter((member) => member.job === "Director")
              .forEach((director) => addScore("people", director.id, score * 1.5));
          }
        }
      }
    }
  });

  // Extract Top N from scored profile
  const getTop = (obj, limit) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((entry) => entry[0]);
  };

  const result = {
    topGenres: getTop(profile.genres, 5),
    topLanguages: getTop(profile.languages, 3),
    topPeople: getTop(profile.people, 5),
  };

  // Cache the profile for 5 minutes
  await setCache(profileCacheKey, result, PROFILE_CACHE_TTL);

  return result;
};

/**
 * Fetch a person's movie filmography directly from TMDB.
 * This is far more reliable than discover's with_people for regional actors.
 */
const fetchPersonFilmography = async (personId) => {
  const cacheKey = `tmdb:filmography:${personId}`;
  let data = await getCache(cacheKey);

  if (!data) {
    try {
      const url = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) return [];
      data = await res.json();
      await setCache(cacheKey, data, MOVIE_CACHE_TTL);
    } catch (err) {
      console.warn(`[Reco] Filmography fetch failed for person ${personId}:`, err.message);
      return [];
    }
  }

  // Return cast movies (movies they acted in) sorted by popularity
  const movies = (data.cast || [])
    .filter((m) => m.poster_path && m.release_date) // must have poster & release date
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return movies;
};

/**
 * Fetch TMDB's own recommendations for a specific movie.
 * TMDB does this well — it finds similar movies by analyzing plot, cast, crew.
 */
const fetchMovieRecommendations = async (movieId) => {
  const cacheKey = `tmdb:reco:movie:${movieId}`;
  let data = await getCache(cacheKey);

  if (!data) {
    try {
      const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) return [];
      data = await res.json();
      await setCache(cacheKey, data, MOVIE_CACHE_TTL);
    } catch (err) {
      console.warn(`[Reco] Movie reco fetch failed for ${movieId}:`, err.message);
      return [];
    }
  }

  return data.results || [];
};

/**
 * Get personalized recommendations for a user.
 *
 * Multi-source approach:
 * 1. Direct actor/director filmography (most reliable for regional cinema)
 * 2. TMDB's own /recommendations for favorited movies
 * 3. Discover API with genre + language as supplement
 * 4. Trending fallback
 *
 * All results are merged, deduplicated, and sorted by relevance.
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

  const allMovies = new Map(); // movieId -> movie data (dedup)
  const sourceScores = new Map(); // movieId -> bonus score for ranking

  const addMovies = (movies, source, bonusScore) => {
    movies.forEach((movie) => {
      if (!movie.id) return;
      if (!allMovies.has(movie.id)) {
        allMovies.set(movie.id, movie);
        sourceScores.set(movie.id, 0);
      }
      sourceScores.set(movie.id, (sourceScores.get(movie.id) || 0) + bonusScore);
    });
    console.log(`[Reco] ${source}: added ${movies.length} movies`);
  };

  // ===== SOURCE 1: Direct filmography of top people (HIGHEST PRIORITY) =====
  if (profile.topPeople.length > 0) {
    // Fetch filmographies for up to 5 people in parallel
    const peopleToFetch = profile.topPeople.slice(0, 5);
    const filmographies = await Promise.all(
      peopleToFetch.map((personId) => fetchPersonFilmography(personId))
    );

    filmographies.forEach((movies, idx) => {
      // Top 25 movies from each person — enough for deep scrolling
      addMovies(movies.slice(0, 25), `Filmography:person_${peopleToFetch[idx]}`, 30 - idx * 3);
    });
  }

  // ===== SOURCE 2: TMDB recommendations for favorited/listed movies =====
  const highValueInteractions = await Interaction.find({
    userId,
    action: { $in: ["add_favorite", "add_to_list"] },
    targetType: "movie",
  })
    .sort({ createdAt: -1 })
    .limit(10);

  if (highValueInteractions.length > 0) {
    // Fetch TMDB recommendations for up to 5 favorited movies
    const moviesToFetch = highValueInteractions.slice(0, 5);
    const recoResults = await Promise.all(
      moviesToFetch.map((interaction) => fetchMovieRecommendations(interaction.targetId))
    );

    recoResults.forEach((movies, idx) => {
      addMovies(movies.slice(0, 15), `TMDBReco:movie_${moviesToFetch[idx].targetId}`, 20);
    });
  }

  // ===== SOURCE 3: Discover API — one query per top language =====
  if (profile.topGenres.length > 0) {
    const genreStr = profile.topGenres.slice(0, 3).join(",");
    const languagesToQuery = profile.topLanguages.length > 0 ? profile.topLanguages : [null];

    for (const lang of languagesToQuery) {
      try {
        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          sort_by: "popularity.desc",
          page: String(page),
          "vote_count.gte": "10",
          with_genres: genreStr,
        });
        if (lang) params.set("with_original_language", lang);

        const url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
        console.log(`[Reco] Discover (${lang || "global"}): ${url}`);
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          // Primary language gets higher score
          const isMainLang = lang === profile.topLanguages[0];
          addMovies(data.results || [], `Discover:${lang || "global"}`, isMainLang ? 15 : 8);
        }
      } catch (err) {
        console.warn(`[Reco] Discover (${lang}) failed:`, err.message);
      }
    }
  }

  // ===== SOURCE 4: Global genre-only discover (different languages) =====
  if (profile.topGenres.length > 0) {
    try {
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: "popularity.desc",
        page: String(page),
        "vote_count.gte": "50",
        with_genres: profile.topGenres.slice(0, 2).join(","),
      });
      const url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
      console.log(`[Reco] Discover (global fallback): ${url}`);
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        addMovies(data.results || [], "Discover:global", 5);
      }
    } catch (err) {
      console.warn("[Reco] Discover global failed:", err.message);
    }
  }

  // ===== Merge, rank, and paginate =====
  if (allMovies.size === 0) {
    console.log("[Reco] No results from any source, falling back to trending");
    return fetchTrending(page);
  }

  // Prefer user's primary language, but also boost secondary languages
  const langSet = new Set(profile.topLanguages);

  // Sort: source bonus + language match bonus + popularity
  const ranked = Array.from(allMovies.values()).sort((a, b) => {
    const langBonusA = a.original_language === profile.topLanguages[0] ? 20 : langSet.has(a.original_language) ? 8 : 0;
    const langBonusB = b.original_language === profile.topLanguages[0] ? 20 : langSet.has(b.original_language) ? 8 : 0;
    const scoreA = (sourceScores.get(a.id) || 0) + langBonusA + (a.popularity || 0) * 0.1;
    const scoreB = (sourceScores.get(b.id) || 0) + langBonusB + (b.popularity || 0) * 0.1;
    return scoreB - scoreA;
  });

  // Paginate (20 per page)
  const perPage = 20;
  const startIdx = (page - 1) * perPage;
  const paginatedResults = ranked.slice(startIdx, startIdx + perPage);

  console.log(`[Reco] Final: ${ranked.length} total movies, returning page ${page} with ${paginatedResults.length} results`);

  return {
    results: paginatedResults,
    page,
    total_pages: Math.ceil(ranked.length / perPage),
    total_results: ranked.length,
  };
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
