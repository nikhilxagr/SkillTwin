import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";
import { z } from "zod";

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root repository .env first, then local apps/api .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

// Normalize GEMINI_APIKEY vs GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY && process.env.GEMINI_APIKEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINI_APIKEY;
}
if (!process.env.API_PORT && process.env.PORT) {
  process.env.API_PORT = process.env.PORT;
}

// Normalize SMTP environment aliases
if (!process.env.SMTP_USER && process.env.GMAIL_USER) {
  process.env.SMTP_USER = process.env.GMAIL_USER;
  process.env.SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
}
if (!process.env.SMTP_PASS && process.env.GMAIL_PASS) {
  process.env.SMTP_PASS = process.env.GMAIL_PASS;
}
if (!process.env.SMTP_USER && process.env.EMAIL_USER) {
  process.env.SMTP_USER = process.env.EMAIL_USER;
}
if (!process.env.SMTP_PASS && process.env.EMAIL_PASS) {
  process.env.SMTP_PASS = process.env.EMAIL_PASS;
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().optional().default("http://localhost:4000").transform((val) => val.trim().replace(/%20/g, "-").replace(/\s+/g, "-").replace(/\/+$/, "")),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173").transform((val) => val.replace(/\/+$/, "")),
  GEMINI_API_KEY: z.string().optional().default(""),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16).default("skilltwin-production-jwt-super-secret-key-2026"),
  COOKIE_SECRET: z.string().min(16).default("skilltwin-cookie-secret-key-2026"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("SkillTwin <noreply@skilltwin.dev>"),
  // OAuth credentials
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default("").transform((val) => val ? val.trim().replace(/%20/g, "-").replace(/\s+/g, "-").replace(/\/+$/, "") : ""),
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  GITHUB_CALLBACK_URL: z.string().optional().default("").transform((val) => val ? val.trim().replace(/%20/g, "-").replace(/\s+/g, "-").replace(/\/+$/, "") : ""),
  LINKEDIN_CLIENT_ID: z.string().optional().default(""),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(""),
  LINKEDIN_CALLBACK_URL: z.string().optional().default("").transform((val) => val ? val.trim().replace(/%20/g, "-").replace(/\s+/g, "-").replace(/\/+$/, "") : ""),
  MOCK_OAUTH: z.coerce.boolean().default(false),
});

export const config = environmentSchema.parse(process.env);
