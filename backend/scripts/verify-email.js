import dotenv from "dotenv";
import { verifyMailConnection } from "../services/mail.service.js";

dotenv.config();

const result = await verifyMailConnection();

if (!result.configured) {
  console.error(`Email is not configured. Missing: ${result.missing.join(", ")}`);
  process.exit(1);
}

if (!result.verified) {
  console.error(`Email transport verification failed (${result.errorCode}).`);
  process.exit(1);
}

console.log(`Email transport verified successfully (${result.provider}).`);
