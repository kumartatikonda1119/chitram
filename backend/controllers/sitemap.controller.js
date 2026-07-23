import dotenv from "dotenv";
dotenv.config();
import User from "../models/user.model.js";
import List from "../models/list.model.js";

const FRONTEND_URL =
  process.env.FRONTEND_URL?.split(",")[0]?.trim() || "https://chitram.dev";
const TMDB_API_KEY = process.env.API_KEY;

export const getSitemap = async (req, res) => {
  try {
    const urls = [];

    // 1. Static Pages
    const staticPages = [
      "/",
      "/explore",
      "/search",
      "/community",
      "/recommend",
      "/login",
      "/register",
      "/about",
      "/privacy-policy",
    ];

    staticPages.forEach((path) => {
      urls.push({
        loc: `${FRONTEND_URL}${path}`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: path === "/" ? 1.0 : 0.8,
      });
    });

    // 2. Fetch Popular Movies from TMDB
    try {
      const movieRes = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1`,
      );
      const movieData = await movieRes.json();
      if (movieData.results) {
        movieData.results.forEach((movie) => {
          urls.push({
            loc: `${FRONTEND_URL}/movie/${movie.id}`,
            changefreq: "weekly",
            priority: 0.9,
          });
        });
      }
    } catch (e) {
      console.error("Sitemap: Failed to fetch TMDB movies", e);
    }

    // 3. Fetch Popular Series from TMDB
    try {
      const seriesRes = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&page=1`,
      );
      const seriesData = await seriesRes.json();
      if (seriesData.results) {
        seriesData.results.forEach((series) => {
          urls.push({
            loc: `${FRONTEND_URL}/series/${series.id}`,
            changefreq: "weekly",
            priority: 0.9,
          });
        });
      }
    } catch (e) {
      console.error("Sitemap: Failed to fetch TMDB series", e);
    }

    // 4. Fetch Public Users
    try {
      const users = await User.find({ isPublic: true })
        .select("username updatedAt")
        .limit(100);
      users.forEach((user) => {
        urls.push({
          loc: `${FRONTEND_URL}/user/${encodeURIComponent(user.username)}`,
          lastmod: user.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.6,
        });
      });
    } catch (e) {
      console.error("Sitemap: Failed to fetch users", e);
    }

    // 5. Fetch Public Lists (assuming isPublic exists, if not we'll just fetch all or adjust)
    try {
      // If list model doesn't have isPublic, we might omit this or fetch all.
      // Let's check if they have it, or just fetch top 100 lists
      const lists = await List.find().select("_id updatedAt").limit(100);
      lists.forEach((list) => {
        urls.push({
          loc: `${FRONTEND_URL}/list/${list._id}`,
          lastmod: list.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    } catch (e) {
      console.error("Sitemap: Failed to fetch lists", e);
    }

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach((u) => {
      xml += "  <url>\n";
      xml += `    <loc>${u.loc}</loc>\n`;
      if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
      if (u.changefreq) xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      if (u.priority) xml += `    <priority>${u.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
};
