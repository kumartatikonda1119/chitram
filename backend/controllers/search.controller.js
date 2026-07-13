import dotenv from "dotenv";
dotenv.config();
import { rewriteQuery } from "../services/ai.service.js";
import { trackInteraction } from "../services/interaction.service.js";
import jwt from "jsonwebtoken";

export const smartSearch = async (req, res) => {
  try {
    const { query, type, genre, language } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const aiResult = await rewriteQuery(query.trim());
    const queries = aiResult.rewrittenQueries || [query.trim()];
    const searchType = type || aiResult.searchType || "movie";

    console.log("Smart search — AI result:", JSON.stringify(aiResult));
    console.log("Smart search — using queries:", queries, "type:", searchType);

    // Search TMDB with each rewritten query and merge results
    const allResults = [];
    const seenIds = new Set();

    for (const q of queries.slice(0, 5)) {
      try {
        let url;
        if (searchType === "person") {
          url = `https://api.themoviedb.org/3/search/person?api_key=${process.env.API_KEY}&query=${encodeURIComponent(q)}`;
        } else if (searchType === "tv") {
          url = `https://api.themoviedb.org/3/search/tv?api_key=${process.env.API_KEY}&query=${encodeURIComponent(q)}`;
        } else {
          url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&query=${encodeURIComponent(q)}`;
        }

        console.log("Smart search — fetching TMDB for:", q);
        const response = await fetch(url);
        console.log("Smart search — TMDB status:", response.status, "for query:", q);

        if (!response.ok) {
          const errText = await response.text();
          console.error("Smart search — TMDB error body:", errText);
          continue;
        }

        const data = await response.json();
        console.log("Smart search — TMDB returned", data.results?.length || 0, "results for:", q);

        if (data.results) {
          for (const item of data.results) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allResults.push(item);
            }
          }
        }
      } catch (err) {
        console.error("Smart search — fetch error for query:", q, err.message);
      }
    }

    // Apply language filter (filter by original_language)
    let filteredResults = allResults;
    if (language && searchType !== "person") {
      filteredResults = filteredResults.filter(
        (item) => item.original_language === language,
      );
    }

    // Apply genre filter (filter by genre_ids)
    if (genre && searchType !== "person") {
      const genreId = parseInt(genre);
      filteredResults = filteredResults.filter(
        (item) => item.genre_ids && item.genre_ids.includes(genreId),
      );
    }

    // Track search interaction for authenticated users (fire-and-forget)
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        trackInteraction(decoded.userId, "search", searchType, query.trim(), {
          query: query.trim(),
          resultCount: filteredResults.length,
        }).catch(() => {});
      }
    } catch {
      // Silent — tracking is best-effort
    }

    return res.status(200).json({
      data: filteredResults,
      ai: {
        intent: aiResult.intent,
        rewrittenQueries: queries,
        searchType,
      },
    });
  } catch (error) {
    console.error("Smart search failed:", error);
    return res.status(500).json({ error: "Smart search failed" });
  }
};

export const autocomplete = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${process.env.API_KEY}&query=${encodeURIComponent(q)}&page=1`,
    );

    if (!response.ok) {
      return res.status(200).json({ suggestions: [] });
    }

    const data = await response.json();

    const suggestions = (data.results || [])
      .filter((item) => ["movie", "tv", "person"].includes(item.media_type))
      .slice(0, 8)
      .map((item) => {
        if (item.media_type === "person") {
          return {
            id: item.id,
            title: item.name,
            type: "person",
            department: item.known_for_department || "Acting",
            poster: item.profile_path
              ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
              : null,
          };
        }

        return {
          id: item.id,
          title: item.title || item.name,
          type: item.media_type,
          year: (item.release_date || item.first_air_date || "").slice(0, 4),
          poster: item.poster_path
            ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
            : null,
        };
      });

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Autocomplete failed:", error);
    return res.status(200).json({ suggestions: [] });
  }
};


export const searchMovie = async (req, res) => {
  try {
    const { movie, lang } = req.query;

    if (!movie) {
      return res.status(400).json({ error: "Please enter the movie name" });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&query=${encodeURIComponent(movie)}`,
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB API error" });
    }

    const data = await response.json();

    if (!data.results) {
      return res.status(200).json({ data: [] });
    }

    let results = data.results;

    if (lang) {
      results = results.filter((m) => m.original_language === lang);
    }

    return res.status(200).json({ data: results });
  } catch (error) {
    
    return res.status(500).json({ err: "Search failed", msg:error });
  }
};

export const searchPerson = async (req, res) => {
  try {
    const personName = req.query.name;
    if (!personName) {
      return res
        .status(400)
        .json({ error: "please enter the name of the person" });
    }
    const response = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${process.env.API_KEY}&query=${personName}`,
    );
    const data = await response.json();
    return res.status(200).json({ data: data.results });
  } catch (error) {
    res.status(404).json({ error: error });
  }
};
export const searchActor = async (req, res) => {
  try {
    const id = req.query.actorid;
    const response = await fetch(
      `https://api.themoviedb.org/3/person/${id}?api_key=${process.env.API_KEY}&append_to_response=movie_credits,combined_credits`,
    );
    const data = await response.json();
    res.status(200).json({ data: data });
  } catch (error) {
    res.status(404).json({ error: error });
  }
};
export const searchDirector = async (req, res) => {
  try {
    const id = req.query.directorid;

    const response = await fetch(
      `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${process.env.API_KEY}`,
    );

    const data = await response.json();

    const directedMovies = data.crew.filter(
      (movie) => movie.job === "Director",
    );

    res.status(200).json(directedMovies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const searchMovieByGenre = async (req, res) => {
  try {
    const { id, lang, page = 1 } = req.query;
    if (!id) {
      return res.status(400).json({ error: "genre is required" });
    }
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&with_genres=${id}&page=${page}`;
    if (lang) {
      url += `&with_original_language=${lang}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json({ 
      data: data.results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exploreMovies = async (req, res) => {
  try {
    const { section = "trending", page = 1 } = req.query;
    let url = "";

    switch (section) {
      case "top_rated":
        url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.API_KEY}&page=${page}`;
        break;
      case "classics":
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&sort_by=vote_average.desc&primary_release_date.lte=2000-12-31&vote_count.gte=500&page=${page}`;
        break;
      case "popular":
        url = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.API_KEY}&page=${page}`;
        break;
      case "now_playing":
        url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.API_KEY}&page=${page}`;
        break;
      case "upcoming":
        url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.API_KEY}&page=${page}`;
        break;
      case "popular_telugu":
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&with_original_language=te&sort_by=popularity.desc&page=${page}`;
        break;
      case "popular_hindi":
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`;
        break;
      case "action":
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&with_genres=28&page=${page}`;
        break;
      case "thriller":
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.API_KEY}&with_genres=53&sort_by=popularity.desc&page=${page}`;
        break;
      case "trending":
      default:
        url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.API_KEY}&page=${page}`;
        break;
    }

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json({
      data: data.results || [],
      page: data.page || Number(page),
      totalPages: data.total_pages || 1,
      totalResults: data.total_results || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: "Explore fetch failed" });
    console.log(err, "hello i am kumar")
  }
};

export const searchMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.API_KEY}&append_to_response=credits,videos,similar,images`,
        { signal: controller.signal },
      );
      clearTimeout(timer);

      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB returned ${response.status}` });
      }

      const data = await response.json();
      return res.status(200).json({ data: data });
    } catch (fetchErr) {
      clearTimeout(timer);
      if (fetchErr.name === "AbortError") {
        console.error("searchMovieById: TMDB fetch timed out for ID:", id);
        return res.status(504).json({ error: "TMDB request timed out" });
      }
      throw fetchErr;
    }
  } catch (error) {
    console.error("searchMovieById Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch movie" });
  }
};

export const searchSeriesByName = async (req, res) => {
  try {
    const seriesName = req.query.name || req.query.seriesName;

    if (!seriesName) {
      return res
        .status(400)
        .json({ error: "Please provide series name in query param: name" });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.API_KEY}&query=${encodeURIComponent(seriesName)}`,
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB API error" });
    }

    const data = await response.json();
    return res.status(200).json({ data: data.results || [] });
  } catch (error) {
    res.status(500).json({ error: "Series search failed" });
  }
};

export const searchSeriesById = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;

    if (!id) {
      return res
        .status(400)
        .json({ error: "Please provide series id in path or query param: id" });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.API_KEY}&append_to_response=credits,videos,images,similar,recommendations`,
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB API error" });
    }

    const data = await response.json();
    return res.status(200).json({ data: data });
  } catch (error) {
    res.status(500).json({ error: "Series fetch by id failed" });
  }
};
export const searchSeason = async (req, res) => {
  try {
    const { seasonNo, seriesId } = req.params;
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNo}?api_key=${process.env.API_KEY}&append_to_response=credits,videos,images,similar,recommendations`,
    );
    const data = await response.json();
    return res.status(200).json({ data: data });
  } catch (error) {
    res.status(404).json({ error: "error in searching season" });
  }
};
export const searchEpisode = async (req, res) => {
  try {
    const { seasonNo, seriesId, episodeId } = req.params;
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNo}/episode/${episodeId}?api_key=${process.env.API_KEY}&append_to_response=credits,videos,images,similar,recommendations`,
    );
    const data = await response.json();
    return res.status(200).json({ data: data });
  } catch (error) {
    res.status(404).json({ error: "error in searching season" });
  }
};
export const getOTTProviders = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${process.env.API_KEY}`,
    );

    const data = await response.json();

    const indiaProviders = data.results?.IN;

    if (!indiaProviders) {
      return res.status(200).json({
        message: "No OTT providers available in India",
        data: null,
      });
    }

    res.status(200).json({
      indiaProviders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSeriesOTTProviders = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=${process.env.API_KEY}`,
    );

    const data = await response.json();

    const indiaProviders = data.results?.IN;

    if (!indiaProviders) {
      return res.status(200).json({
        message: "No OTT providers available in India",
        data: null,
      });
    }

    res.status(200).json({
      indiaProviders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Proxy endpoint to download TMDB images.
 * Fetches the image server-side and streams it to the browser
 * with Content-Disposition: attachment to force a real download.
 *
 * GET /api/search/download-image?path=/abc123.jpg&name=MovieName-1
 */
export const downloadTmdbImage = async (req, res) => {
  try {
    const { path, name } = req.query;

    if (!path) {
      return res.status(400).json({ error: "Missing 'path' query parameter" });
    }

    // Sanitize: path must start with / and only contain safe characters
    if (!/^\/[a-zA-Z0-9_\-]+\.[a-zA-Z]+$/.test(path)) {
      return res.status(400).json({ error: "Invalid image path" });
    }

    const imageUrl = `https://image.tmdb.org/t/p/original${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch image from TMDB" });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const filename = `${(name || "chitram-image").replace(/[^a-zA-Z0-9_\- ]/g, "")}.${ext}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the response body directly to the client
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Image download timed out" });
    }
    console.error("downloadTmdbImage error:", error.message);
    res.status(500).json({ error: "Failed to download image" });
  }
};
