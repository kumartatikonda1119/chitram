import express from "express";
import { register, login, forgotPassword } from "../controllers/auth.controller.js";
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.patch('/forgotPassword', forgotPassword);
export default router;