import nodemailer from "nodemailer";

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const transporter = createTransporter();
  const appName = "Chitram";
  const subject =
    purpose === "verify_email"
      ? `${appName} email verification code`
      : `${appName} password reset code`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${appName} Security Code</h2>
      <p>Your one-time code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otp}</p>
      <p>This code is valid for 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[OTP] ${purpose} for ${to}: ${otp}`);
    return { sent: false, fallbackLogged: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { sent: true, fallbackLogged: false };
};
