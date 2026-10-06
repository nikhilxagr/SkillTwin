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

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173").transform((val) => val.replace(/\/+$/, "")),
  GEMINI_API_KEY: z.string().optional().default(""),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16).default("skilltwin-production-jwt-super-secret-key-2026"),
  COOKIE_SECRET: z.string().min(16).default("skilltwin-cookie-secret-key-2026"),
  EMAIL_FROM: z.string().default("SkillTwin <noreply@skilltwin.dev>"),
});

export const config = environmentSchema.parse(process.env);
