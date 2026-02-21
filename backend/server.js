import express from "express";
import dotenv from "dotenv";
import searchRoute from "./routes/search.route.js";
import mongoose from "mongoose";
import authRoute from "./routes/auth.route.js";
import { protect } from "./middleware/auth.js";
import favoriteRoutes from "./routes/favourite.route.js"
import listRoutes from "./routes/list.route.js"
import cors from "cors";
const app = express();
dotenv.config();
const port = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const MONGODB_URI = process.env.MONGODB_URI;
try {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB ✅");
} catch (error) {
  console.error("Database connection error:", error.message);
}
app.use(cors({
  origin:FRONTEND_URL,
  credentials:true
}

));
app.use(express.json());
app.use("/api/favourite", favoriteRoutes);
app.use("/api/search", searchRoute);
app.use("/api/auth", authRoute);
app.use("/api/lists", listRoutes);
app.get("/profile", protect, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});
app.get("/", (req, res) => {
  res.send("Chitram is running");
});
app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});
