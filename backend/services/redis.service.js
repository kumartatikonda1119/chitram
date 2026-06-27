import Redis from "ioredis";

let client = null;
let isReady = false;

/**
 * Initialise the Redis connection.
 * Call once at startup (server.js). If REDIS_URL is not set the app
 * continues to work — every cache helper silently returns null.
 */
export const initRedis = () => {
  const url = process.env.REDIS_URL?.trim();

  if (!url) {
    console.warn("REDIS_URL is not set — caching is disabled");
    return;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    connectTimeout: 10_000,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 500, 3000);
    },
  });

  client.on("connect", () => {
    isReady = true;
    console.log("Redis connected ✅");
  });

  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  client.on("close", () => {
    isReady = false;
  });
};

/** true when the client is connected and responsive */
export const isRedisReady = () => isReady && client !== null;

/**
 * Get a cached value (parsed JSON) or null on miss / error.
 */
export const getCache = async (key) => {
  if (!isReady || !client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Store a JSON-serialisable value with a TTL (seconds).
 */
export const setCache = async (key, data, ttlSeconds) => {
  if (!isReady || !client) return;
  try {
    await client.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch {
    /* swallow — caching is best-effort */
  }
};

/**
 * Delete one or more exact keys.
 */
export const delCache = async (...keys) => {
  if (!isReady || !client || keys.length === 0) return;
  try {
    await client.del(...keys);
  } catch {
    /* swallow */
  }
};

/**
 * Set a cooldown key (used for OTP rate limiting).
 * Returns true if the key was set, false if Redis is unavailable.
 */
export const setCooldown = async (key, ttlSeconds) => {
  if (!isReady || !client) return false;
  try {
    await client.set(key, "1", "EX", ttlSeconds);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get the remaining TTL of a cooldown key (seconds).
 * Returns 0 if expired / missing / Redis unavailable.
 */
export const getCooldownTTL = async (key) => {
  if (!isReady || !client) return 0;
  try {
    const ttl = await client.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch {
    return 0;
  }
};

/** Expose raw client for the health check */
export const getRedisClient = () => client;
