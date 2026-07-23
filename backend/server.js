import express from "express";
import dotenv from "dotenv";
import searchRoute from "./routes/search.route.js";
import mongoose from "mongoose";
import authRoute from "./routes/auth.route.js";
import { protect } from "./middleware/auth.js";
import favoriteRoutes from "./routes/favourite.route.js";
import listRoutes from "./routes/list.route.js";
import interactionRoutes from "./routes/interaction.route.js";
import recommendationRoutes from "./routes/recommendation.route.js";
import notificationRoutes from "./routes/notification.route.js";
import reviewRoutes from "./routes/review.route.js";
import profileRoutes from "./routes/profile.route.js";
import followRoutes from "./routes/follow.route.js";
import communityRoutes from "./routes/community.route.js";
import postRoutes from "./routes/post.route.js";
import sitemapRoutes from "./routes/sitemap.route.js";
import seoRoutes from "./routes/seo.route.js";
import cors from "cors";
import {
  getMailConfigurationStatus,
  verifyMailConnection,
} from "./services/mail.service.js";
import { initRedis, isRedisReady } from "./services/redis.service.js";
import { initAI, isAIReady } from "./services/ai.service.js";
const app = express();
dotenv.config();
const port = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

const defaultAllowedOrigins = [
  "https://www.chitram.dev",
  "https://chitram.dev",
  "https://chitram.onrender.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

const envAllowedOrigins = FRONTEND_URL
  ? FRONTEND_URL.split(",")
      .map((url) => normalizeOrigin(url))
      .filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set(
    [...defaultAllowedOrigins, ...envAllowedOrigins, RENDER_EXTERNAL_URL]
      .map((url) => normalizeOrigin(url))
      .filter(Boolean),
  ),
);

try {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB ✅");
} catch (error) {
  console.error("Database connection error:", error.message);
}

initRedis();
initAI();
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/favourite", favoriteRoutes);
app.use("/api/search", searchRoute);
app.use("/api/auth", authRoute);
app.use("/api/lists", listRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", sitemapRoutes);
app.use("/seo", seoRoutes);
app.get("/profile", protect, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});
app.get("/health", (req, res) => {
  const mail = getMailConfigurationStatus();
  res.json({
    status: "ok",
    message: "Chitram backend is running",
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      email: mail.configured ? "configured" : "not_configured",
      redis: isRedisReady() ? "connected" : "disconnected",
      ai: isAIReady() ? "enabled" : "disabled",
    },
  });
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);

  verifyMailConnection().then((mail) => {
    if (mail.verified) {
      console.log(`Email transport verified (${mail.provider})`);
      return;
    }

    if (!mail.configured) {
      console.warn(
        `Email transport is not configured: ${mail.missing.join(", ")}`,
      );
    }
  });
});
