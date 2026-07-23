import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendOtpEmail } from "../services/mail.service.js";
import { getCooldownTTL, setCooldown } from "../services/redis.service.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const SHOULD_EXPOSE_DEV_OTP = process.env.SHOW_DEV_OTP === "true";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  authProviders: user.authProviders,
  isPublic: user.isPublic,
  bio: user.bio,
});

const buildOtpCode = () => `${randomInt(100000, 1000000)}`;

const getOtpRetryAfter = async ({ email, purpose }) => {
  // Try Redis first (fast path)
  const redisTTL = await getCooldownTTL(`otp:cooldown:${email}:${purpose}`);
  if (redisTTL > 0) return redisTTL;

  // Fallback to MongoDB if Redis is unavailable
  const latestOtp = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!latestOtp) return 0;

  const ageSeconds = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - ageSeconds);
};

const saveOtp = async ({ email, purpose, code, payload = {} }) => {
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email, purpose });
  await Otp.create({ email, purpose, codeHash, payload, expiresAt });

  // Set cooldown in Redis so subsequent checks skip MongoDB
  await setCooldown(
    `otp:cooldown:${email}:${purpose}`,
    OTP_RESEND_COOLDOWN_SECONDS,
  );
};

const verifyOtpCode = async ({ email, purpose, otp }) => {
  const otpRecord = await Otp.findOne({ email, purpose }).sort({
    createdAt: -1,
  });

  if (!otpRecord) {
    return { valid: false, error: "OTP not found or expired" };
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return { valid: false, error: "OTP expired" };
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.codeHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return {
        valid: false,
        error: "Too many invalid attempts. Request a new OTP.",
      };
    }
    await otpRecord.save();
    return { valid: false, error: "Invalid OTP" };
  }

  return { valid: true, otpRecord };
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const sendSavedOtp = async ({ email, purpose, otp, payload = {} }) => {
  await saveOtp({ email, purpose, code: otp, payload });

  try {
    return await sendOtpEmail({ to: email, otp, purpose });
  } catch (error) {
    await Otp.deleteMany({ email, purpose });
    throw error;
  }
};

const handleOtpError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  if (String(error.code || "").startsWith("EMAIL_")) {
    return res.status(503).json({
      error: "We could not send the email right now. Please try again shortly.",
    });
  }

  return res.status(500).json({ error: fallbackMessage });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const userExist = await User.findOne({ email: normalizedEmail });
    if (userExist) {
      if (userExist.isEmailVerified) {
        return res.status(409).json({
          error: "Account already exists. Please login.",
        });
      }

      if (
        userExist.authProviders?.includes("google") &&
        !userExist.authProviders?.includes("local")
      ) {
        return res.status(409).json({
          error:
            "This email is registered with Google. Continue with Google login.",
        });
      }
    }

    const retryAfter = await getOtpRetryAfter({
      email: normalizedEmail,
      purpose: "verify_email",
    });
    if (retryAfter > 0) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Please wait ${retryAfter} seconds before requesting another OTP.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = buildOtpCode();
    const emailMeta = await sendSavedOtp({
      email: normalizedEmail,
      purpose: "verify_email",
      otp,
      payload: {
        username: username.trim(),
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Verification OTP sent to your email",
      email: normalizedEmail,
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return handleOtpError(res, error, "Failed to register");
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await verifyOtpCode({
      email: normalizedEmail,
      purpose: "verify_email",
      otp,
    });

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const { payload, _id: otpId } = result.otpRecord;

    if (!payload?.username || !payload?.password) {
      await Otp.deleteOne({ _id: otpId });
      return res.status(400).json({ error: "Invalid registration request" });
    }

    const userExist = await User.findOne({ email: normalizedEmail });

    if (userExist && userExist.isEmailVerified) {
      await Otp.deleteOne({ _id: otpId });
      return res
        .status(409)
        .json({ error: "Account already verified. Please login." });
    }

    let user;
    if (userExist) {
      userExist.username = payload.username;
      userExist.password = payload.password;
      userExist.isEmailVerified = true;
      userExist.authProviders = Array.from(
        new Set([...(userExist.authProviders || []), "local"]),
      );
      user = await userExist.save();
    } else {
      user = await User.create({
        username: payload.username,
        email: normalizedEmail,
        password: payload.password,
        isEmailVerified: true,
        authProviders: ["local"],
      });
    }

    await Otp.deleteOne({ _id: otpId });

    const token = buildToken(user._id);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existingOtp = await Otp.findOne({
      email: normalizedEmail,
      purpose: "verify_email",
    }).sort({ createdAt: -1 });

    if (!existingOtp?.payload?.username || !existingOtp?.payload?.password) {
      return res.status(400).json({
        error: "No pending signup found. Please start registration again.",
      });
    }

    const retryAfter = await getOtpRetryAfter({
      email: normalizedEmail,
      purpose: "verify_email",
    });
    if (retryAfter > 0) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Please wait ${retryAfter} seconds before requesting another OTP.`,
      });
    }

    const otp = buildOtpCode();
    const emailMeta = await sendSavedOtp({
      email: normalizedEmail,
      purpose: "verify_email",
      otp,
      payload: existingOtp.payload,
    });

    return res.status(200).json({
      message: "Verification OTP resent",
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return handleOtpError(res, error, "Failed to resend OTP");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const doesUserExist = await User.findOne({ email: normalizedEmail });
    if (!doesUserExist) {
      return res.status(404).json({ error: "Invalid credentials" });
    }

    if (!doesUserExist.isEmailVerified) {
      return res.status(403).json({
        error: "Email is not verified. Please verify with OTP first.",
      });
    }

    if (
      !doesUserExist.authProviders?.includes("local") ||
      !doesUserExist.password
    ) {
      return res.status(400).json({
        error: "This account uses Google login. Continue with Google.",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      doesUserExist.password,
    );
    if (!passwordMatched) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = buildToken(doesUserExist._id);

    return res.status(200).json({
      token,
      user: sanitizeUser(doesUserExist),
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

    let payload;
    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (accessToken) {
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      payload = response.data;
    }

    if (!payload?.email || (!payload?.sub && !payload?.id)) {
      return res.status(400).json({ error: "Invalid Google token payload" });
    }

    if (!payload.email_verified && !accessToken) {
      return res.status(400).json({ error: "Google email is not verified" });
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub || payload.id;
    const displayName = payload.name || email.split("@")[0];
    const avatar = payload.picture || null;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: displayName,
        email,
        authProviders: ["google"],
        isEmailVerified: true,
        googleId,
        avatar,
      });
    } else {
      const providers = new Set(user.authProviders || []);
      providers.add("google");
      user.authProviders = [...providers];
      user.googleId = googleId;
      user.avatar = avatar || user.avatar;
      user.isEmailVerified = true;
      user = await user.save();
    }

    const token = buildToken(user._id);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ error: "Google authentication failed" });
  }
};

export const requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with this email" });
    }

    if (!user.authProviders?.includes("local")) {
      return res.status(400).json({
        error:
          "This account uses Google login and does not have a password to reset.",
      });
    }

    const retryAfter = await getOtpRetryAfter({
      email: normalizedEmail,
      purpose: "reset_password",
    });
    if (retryAfter > 0) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Please wait ${retryAfter} seconds before requesting another OTP.`,
      });
    }

    const otp = buildOtpCode();
    const emailMeta = await sendSavedOtp({
      email: normalizedEmail,
      purpose: "reset_password",
      otp,
    });

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return handleOtpError(res, error, "Failed to send reset OTP");
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !/^\d{6}$/.test(String(otp)) || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.authProviders?.includes("local")) {
      return res.status(400).json({
        error:
          "This account uses Google login and does not have a password to reset.",
      });
    }

    const result = await verifyOtpCode({
      email: normalizedEmail,
      purpose: "reset_password",
      otp,
    });

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await Otp.deleteOne({ _id: result.otpRecord._id });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset password" });
  }
};
