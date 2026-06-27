import { getCache, setCache } from "../services/redis.service.js";

/**
 * Express middleware factory for route-level caching.
 *
 * @param {(req: import('express').Request) => string} keyBuilder
 *   A function that receives the request and returns the Redis cache key.
 * @param {number} ttlSeconds
 *   How long to cache the response (in seconds).
 */
export const cacheRoute = (keyBuilder, ttlSeconds) => {
  return async (req, res, next) => {
    let key;
    try {
      key = keyBuilder(req);
    } catch {
      return next();
    }

    if (!key) return next();

    const cached = await getCache(key);
    if (cached !== null) {
      return res.status(200).json(cached);
    }

    // Intercept res.json to cache the response before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};
