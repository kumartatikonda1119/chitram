import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.API_KEY;
const FRONTEND_URL =
  process.env.FRONTEND_URL?.split(",")[0]?.trim() || "https://chitram.dev";

// Helper to fetch the base index.html from the frontend
const getBaseHtml = async () => {
  try {
    const res = await fetch(FRONTEND_URL);
    if (!res.ok) throw new Error("Failed to fetch frontend HTML");
    return await res.text();
  } catch (error) {
    console.error("SEO Interceptor: Failed to fetch base HTML", error);
    return `<!DOCTYPE html><html><head><title>Chitram</title></head><body></body></html>`;
  }
};

const injectMetaTags = (html, meta) => {
  const metaTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="og:type" content="${meta.type}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${meta.image}" />
  `;

  // Replace existing title or inject into head
  let modifiedHtml = html;
  if (modifiedHtml.includes("<title>")) {
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, "");
  }
  return modifiedHtml.replace("</head>", `${metaTags}\n</head>`);
};

export const interceptMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`,
    );
    if (!tmdbRes.ok) return res.redirect(FRONTEND_URL); // fallback

    const movie = await tmdbRes.json();
    const html = await getBaseHtml();

    const title = `${movie.title}${movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ""} - Chitram`;
    const finalHtml = injectMetaTags(html, {
      title,
      description: movie.overview || "Discover movies on Chitram.",
      image: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : `${FRONTEND_URL}/og-image.jpg`,
      url: `${FRONTEND_URL}/movie/${id}`,
      type: "video.movie",
    });

    res.send(finalHtml);
  } catch (error) {
    console.error("SEO Movie Interceptor error:", error);
    res.redirect(FRONTEND_URL);
  }
};

export const interceptSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`,
    );
    if (!tmdbRes.ok) return res.redirect(FRONTEND_URL);

    const series = await tmdbRes.json();
    const html = await getBaseHtml();

    const title = `${series.name}${series.first_air_date ? ` (${series.first_air_date.slice(0, 4)})` : ""} - Chitram`;
    const finalHtml = injectMetaTags(html, {
      title,
      description: series.overview || "Discover TV series on Chitram.",
      image: series.poster_path
        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
        : `${FRONTEND_URL}/og-image.jpg`,
      url: `${FRONTEND_URL}/series/${id}`,
      type: "video.tv_show",
    });

    res.send(finalHtml);
  } catch (error) {
    console.error("SEO Series Interceptor error:", error);
    res.redirect(FRONTEND_URL);
  }
};

export const interceptPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_API_KEY}`,
    );
    if (!tmdbRes.ok) return res.redirect(FRONTEND_URL);

    const person = await tmdbRes.json();
    const html = await getBaseHtml();

    const finalHtml = injectMetaTags(html, {
      title: `${person.name} - Chitram`,
      description:
        person.biography ||
        `Explore ${person.name}'s filmography on Chitram.`,
      image: person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : `${FRONTEND_URL}/og-image.jpg`,
      url: `${FRONTEND_URL}/person/${id}`,
      type: "profile",
    });

    res.send(finalHtml);
  } catch (error) {
    console.error("SEO Person Interceptor error:", error);
    res.redirect(FRONTEND_URL);
  }
};
