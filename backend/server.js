import express from "express";
import dotenv from "dotenv";
import searchRoute from "./routes/search.route.js";
import mongoose from "mongoose";
import authRoute from "./routes/auth.route.js";
import { protect } from "./middleware/auth.js";
import favoriteRoutes from "./routes/favourite.route.js";
import listRoutes from "./routes/list.route.js";
import cors from "cors";
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

const allowedOrigins = [
  ...(FRONTEND_URL
    ? FRONTEND_URL.split(",")
        .map((url) => normalizeOrigin(url))
        .filter(Boolean)
    : []),
  normalizeOrigin(RENDER_EXTERNAL_URL),
].filter(Boolean);

try {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB ✅");
} catch (error) {
  console.error("Database connection error:", error.message);
}
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
app.get("/profile", protect, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Chitram backend is running" });
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
