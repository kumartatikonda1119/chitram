import { GoogleGenAI } from "@google/genai";
import { getCache, setCache } from "./redis.service.js";
import crypto from "node:crypto";

let genai = null;

const REWRITE_CACHE_TTL = 86400; // 24 hours

const SYSTEM_PROMPT = `You are a movie/TV show search query optimizer for a platform called Chitram.

Your job is to analyze a user's search query and return a structured JSON response.

Rules:
1. If the user typed an exact or near-exact movie/TV show title (even with spelling mistakes), correct the spelling and return it.
2. If the user described a movie/TV show scene, plot, or concept, infer the most likely movie/TV show titles (up to 5).
3. If the user is searching for a person (actor, director), return their corrected name.
4. Classify the intent as one of: "title", "description", "person", "genre".
5. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.

Response format:
{
  "intent": "title" | "description" | "person" | "genre",
  "rewrittenQueries": ["query1", "query2"],
  "searchType": "movie" | "tv" | "person"
}

Examples:

User: "the pursuit of happiness"
{"intent":"title","rewrittenQueries":["The Pursuit of Happyness"],"searchType":"movie"}

User: "movie where father struggles for his son and becomes homeless"
{"intent":"description","rewrittenQueries":["The Pursuit of Happyness","Bicycle Thieves","Life Is Beautiful"],"searchType":"movie"}

User: "moon landing movie"
{"intent":"description","rewrittenQueries":["First Man","Apollo 13","The Right Stuff"],"searchType":"movie"}

User: "nolan"
{"intent":"person","rewrittenQueries":["Christopher Nolan"],"searchType":"person"}

User: "mind bending movies about dreams"
{"intent":"description","rewrittenQueries":["Inception","Paprika","The Cell","Eternal Sunshine of the Spotless Mind"],"searchType":"movie"}

User: "allu arjun"
{"intent":"person","rewrittenQueries":["Allu Arjun"],"searchType":"person"}

User: "godari gattupaina"
{"intent":"title","rewrittenQueries":["Godari Gattupaina"],"searchType":"movie"}`;

/**
 * Initialize the Gemini client.
 * Call once at startup. If GEMINI_API_KEY is not set, AI features are
 * silently disabled and queries pass through unchanged.
 */
export const initAI = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set — AI search is disabled");
    return;
  }

  genai = new GoogleGenAI({ apiKey });
  console.log("Gemini AI initialized ✅");
};

/** true when the Gemini client is ready */
export const isAIReady = () => genai !== null;

/**
 * Rewrite a user query using Gemini for better TMDB search results.
 * Returns the structured response or a passthrough if AI is unavailable.
 */
export const rewriteQuery = async (userQuery) => {
  const trimmed = (userQuery || "").trim();

  if (!trimmed) {
    return { intent: "title", rewrittenQueries: [], searchType: "movie" };
  }

  // If AI is not available, pass through the query unchanged
  if (!genai) {
    return {
      intent: "title",
      rewrittenQueries: [trimmed],
      searchType: "movie",
    };
  }

  // Check Redis cache first
  const hash = crypto.createHash("md5").update(trimmed.toLowerCase()).digest("hex");
  const cacheKey = `ai:rewrite:${hash}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `User search query: "${trimmed}"`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty Gemini response");

    // Strip markdown code block fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);

    const result = {
      intent: parsed.intent || "title",
      rewrittenQueries: Array.isArray(parsed.rewrittenQueries)
        ? parsed.rewrittenQueries.slice(0, 5)
        : [trimmed],
      searchType: parsed.searchType || "movie",
    };

    // Cache for 24 hours
    await setCache(cacheKey, result, REWRITE_CACHE_TTL);

    return result;
  } catch (error) {
    console.error("Gemini rewrite failed:", error.message);
    // Graceful fallback: pass through unchanged
    return {
      intent: "title",
      rewrittenQueries: [trimmed],
      searchType: "movie",
    };
  }
};
