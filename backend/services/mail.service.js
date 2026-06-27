import nodemailer from "nodemailer";
import { Resend } from "resend";

let transporter;
let resendClient;
const getMailConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const from = process.env.SMTP_FROM?.trim();

  return { host, port, user, pass, from };
};

export const getMailConfigurationStatus = () => {
  const { host, port, user, pass, from } = getMailConfig();
  const missing = [];

  if (!host) missing.push("SMTP_HOST");
  if (!Number.isInteger(port) || port <= 0) missing.push("SMTP_PORT");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!from) missing.push("SMTP_FROM");

  return {
    configured: missing.length === 0,
    missing,
    provider: host === "smtp.resend.com" ? "resend" : "smtp",
  };
};

const createTransporter = () => {
  const { host, port, user, pass } = getMailConfig();
  const status = getMailConfigurationStatus();

  if (!status.configured) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
};

export const verifyMailConnection = async () => {
  const status = getMailConfigurationStatus();

  if (!status.configured) {
    return { ...status, verified: false };
  }

  if (status.provider === "resend") {
    // Resend SDK does not require explicit verification connection like SMTP
    return { ...status, verified: true };
  }

  const mailer = createTransporter();
  try {
    await mailer.verify();
    return { ...status, verified: true };
  } catch (error) {
    console.error("Email transport verification failed", {
      provider: status.provider,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });
    return { ...status, verified: false, errorCode: error.code || "SMTP_ERROR" };
  }
};

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const status = getMailConfigurationStatus();
  const appName = "Chitram";
  const subject =
    purpose === "verify_email"
      ? `${appName} email verification code`
      : `${appName} password reset code`;
  const action =
    purpose === "verify_email" ? "verify your email" : "reset your password";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${appName} Security Code</h2>
      <p>Your one-time code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otp}</p>
      <p>This code is valid for 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  if (!status.configured) {
    const allowDevLog =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_OTP_LOG === "true";

    if (allowDevLog) {
      console.warn(`[DEV OTP] ${purpose} for ${to}: ${otp}`);
      return { sent: false, fallbackLogged: true };
    }

    const error = new Error(
      `Email service is not configured. Missing: ${status.missing.join(", ")}`,
    );
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  try {
    const { from, pass } = getMailConfig();

    if (status.provider === "resend") {
      if (!resendClient) {
        resendClient = new Resend(pass);
      }

      const { data, error } = await resendClient.emails.send({
        from,
        to,
        subject,
        text: `Use ${otp} to ${action}. This code expires in 10 minutes. If you did not request this, ignore this email.`,
        html,
      });

      if (error) {
        const err = new Error(error.message);
        err.code = "EMAIL_RECIPIENT_REJECTED";
        throw err;
      }

      return {
        sent: true,
        fallbackLogged: false,
        messageId: data?.id,
      };
    }

    const mailer = createTransporter();
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: `Use ${otp} to ${action}. This code expires in 10 minutes. If you did not request this, ignore this email.`,
      html,
    });

    if (info.rejected?.length > 0 || info.accepted?.length === 0) {
      const error = new Error("The email provider rejected the recipient");
      error.code = "EMAIL_RECIPIENT_REJECTED";
      throw error;
    }

    return {
      sent: true,
      fallbackLogged: false,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("OTP email delivery failed", {
      provider: status.provider,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });

    if (!String(error.code || "").startsWith("EMAIL_")) {
      error.code = "EMAIL_DELIVERY_FAILED";
    }
    throw error;
  }
};
