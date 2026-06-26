import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((val) => val.split(",").map((origin) => origin.trim())),
  JWT_SECRET: z.string().min(10, "JWT Secret minimal 10 karakter"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_URL: z.string().min(1),
  /** Cloudflare R2 (opsional) — fallback upload jika file melebihi limit Cloudinary */
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(5).default("supersecretbotkey"),
  /** Chat ID penerima notifikasi approval (pisahkan koma). User harus /start bot dulu. */
  TELEGRAM_NOTIFY_CHAT_IDS: z.string().optional(),
  SMTP_EMAIL: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
