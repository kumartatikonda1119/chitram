import express from "express";
import {
  interceptMovie,
  interceptSeries,
  interceptPerson,
} from "../controllers/seo.controller.js";

const router = express.Router();

// These routes act as targets for frontend proxies
router.get("/movie/:id", interceptMovie);
router.get("/series/:id", interceptSeries);
router.get("/person/:id", interceptPerson);

export default router;
