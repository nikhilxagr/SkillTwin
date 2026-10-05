import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  GEMINI_API_KEY: z.string().optional().default(""),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16).default("skilltwin-production-jwt-super-secret-key-2026"),
  COOKIE_SECRET: z.string().min(16).default("skilltwin-cookie-secret-key-2026"),
  EMAIL_FROM: z.string().default("SkillTwin <noreply@skilltwin.dev>"),
});

export const config = environmentSchema.parse(process.env);
