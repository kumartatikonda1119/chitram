import express from "express";
import {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  googleAuth,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-register-otp", verifyRegisterOtp);
router.post("/resend-register-otp", resendRegisterOtp);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password/request-otp", requestPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

export default router;
