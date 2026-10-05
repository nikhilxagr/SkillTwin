import type { Request, Response, NextFunction } from "express";
import { verifySessionJwt, toSafeUser } from "./auth.security.js";
import { dbService } from "../database/database.service.js";
import type { SafeUser } from "@skilltwin/contracts";

export const COOKIE_NAME = "skilltwin_session";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      userId?: string;
    }
  }
}

/**
 * Extracts session token from HTTP-only cookie or Authorization header
 */
export function extractToken(req: Request): string | null {
  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  // 2. Check signed cookies if applicable
  if (req.signedCookies && req.signedCookies[COOKIE_NAME]) {
    return req.signedCookies[COOKIE_NAME];
  }

  // 3. Fallback to Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware: Strictly requires an authenticated, email-verified user
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in.",
    });
    return;
  }

  const payload = verifySessionJwt(token);
  if (!payload || !payload.id) {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please sign in again.",
    });
    return;
  }

  try {
    const user = await dbService.users.findOne({ _id: payload.id });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found.",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email address before continuing.",
        requiresVerification: true,
      });
      return;
    }

    req.user = toSafeUser(user);
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
}

/**
 * Middleware: Optional authentication (attaches user if session exists, but doesn't block)
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const payload = verifySessionJwt(token);
  if (!payload || !payload.id) {
    return next();
  }

  try {
    const user = await dbService.users.findOne({ _id: payload.id });
    if (user && user.emailVerified) {
      req.user = toSafeUser(user);
      req.userId = user._id;
    }
  } catch (e) {
    // Ignore error in optional auth
  }

  next();
}
