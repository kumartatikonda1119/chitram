import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendOtpEmail } from "../services/mail.service.js";

const OTP_EXPIRY_MINUTES = 10;
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
});

const buildOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const saveOtp = async ({ email, purpose, code, payload = {} }) => {
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email, purpose });
  await Otp.create({ email, purpose, codeHash, payload, expiresAt });
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
    return { valid: false, error: "Invalid OTP" };
  }

  return { valid: true, otpRecord };
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = buildOtpCode();
    await saveOtp({
      email: normalizedEmail,
      purpose: "verify_email",
      code: otp,
      payload: {
        username: username.trim(),
        password: hashedPassword,
      },
    });

    const emailMeta = await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: "verify_email",
    });

    return res.status(200).json({
      message: "Verification OTP sent to your email",
      email: normalizedEmail,
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to register" });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
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

    const otp = buildOtpCode();
    await saveOtp({
      email: normalizedEmail,
      purpose: "verify_email",
      code: otp,
      payload: existingOtp.payload,
    });

    const emailMeta = await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: "verify_email",
    });

    return res.status(200).json({
      message: "Verification OTP resent",
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to resend OTP" });
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
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.sub) {
      return res.status(400).json({ error: "Invalid Google token payload" });
    }

    if (!payload.email_verified) {
      return res.status(400).json({ error: "Google email is not verified" });
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;
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

    const otp = buildOtpCode();
    await saveOtp({
      email: normalizedEmail,
      purpose: "reset_password",
      code: otp,
    });

    const emailMeta = await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: "reset_password",
    });

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
      devOtp: SHOULD_EXPOSE_DEV_OTP ? otp : undefined,
      emailFallback: emailMeta.fallbackLogged,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send reset OTP" });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp || !newPassword) {
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
