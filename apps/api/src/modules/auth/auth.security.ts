import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import type { UserDoc } from "../database/database.types.js";
import type { SafeUser } from "@skilltwin/contracts";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare plain-text password with bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token (32 bytes / 64 hex chars)
 * and its SHA-256 hash for database storage
 */
export function generateSecureToken(): { rawToken: string; hashedToken: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
}

/**
 * Compute SHA-256 hash of a raw token
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Create a signed JWT session token (7-day validity)
 */
export function createSessionJwt(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, config.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

/**
 * Verify and decode session JWT
 */
export function verifySessionJwt(token: string): { id: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; email: string };
    if (!decoded || !decoded.id) return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Convert UserDoc to SafeUser (NEVER leaks password hash or tokens)
 */
export function toSafeUser(user: UserDoc): SafeUser {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    avatarUrl: user.avatarUrl || "",
    profile: {
      headline: user.profile?.headline || "",
      targetRole: user.profile?.targetRole || "Full Stack Developer",
      bio: user.profile?.bio || "",
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
