import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../../config.js";
import { authService } from "./auth.service.js";
import { requireAuth, COOKIE_NAME } from "./auth.middleware.js";
import {
  signupRequestSchema,
  loginRequestSchema,
  verifyEmailRequestSchema,
  resendVerificationRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  updateProfileRequestSchema,
} from "@skilltwin/contracts";

export const authRouter = Router();
export const profileRouter = Router();

// Strict rate limiters for auth endpoints to protect against brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 25,
  message: {
    success: false,
    message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helper to set secure HTTP-only session cookie
 */
function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

/**
 * Helper to clear session cookie
 */
function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

// ==========================================
// 1. SIGNUP
// ==========================================
authRouter.post("/signup", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = signupRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid registration data";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const result = await authService.signup(parseResult.data);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.status(201).json(result);
});

// ==========================================
// 2. LOGIN
// ==========================================
authRouter.post("/login", loginRateLimiter, async (req: Request, res: Response) => {
  const parseResult = loginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid credentials format";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const result = await authService.login(parseResult.data);
  if (!result.success) {
    if (result.requiresVerification) {
      res.status(403).json(result);
      return;
    }
    res.status(401).json(result);
    return;
  }

  // Set HTTP-only secure cookie
  if (result.token) {
    setSessionCookie(res, result.token);
  }

  res.status(200).json({
    success: true,
    message: result.message,
    user: result.user,
    token: result.token,
  });
});

// ==========================================
// 3. LOGOUT
// ==========================================
authRouter.post("/logout", (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ==========================================
// 4. CURRENT AUTHENTICATED USER (GET /me)
// ==========================================
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// ==========================================
// 5. EMAIL VERIFICATION
// ==========================================
authRouter.get("/verify-email", async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const result = await authService.verifyEmail(token);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.status(200).json(result);
});

authRouter.post("/verify-email", async (req: Request, res: Response) => {
  const parseResult = verifyEmailRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: "Verification token is required." });
    return;
  }

  const result = await authService.verifyEmail(parseResult.data.token);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.status(200).json(result);
});

// ==========================================
// 6. RESEND EMAIL VERIFICATION
// ==========================================
authRouter.post("/resend-verification", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = resendVerificationRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: "Valid email address is required." });
    return;
  }

  const result = await authService.resendVerification(parseResult.data.email);
  res.status(200).json(result);
});

// ==========================================
// 7. FORGOT PASSWORD
// ==========================================
authRouter.post("/forgot-password", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = forgotPasswordRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: "Valid email address is required." });
    return;
  }

  const result = await authService.forgotPassword(parseResult.data.email);
  res.status(200).json(result);
});

// ==========================================
// 8. RESET PASSWORD
// ==========================================
authRouter.post("/reset-password", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = resetPasswordRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid reset data";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const result = await authService.resetPassword(parseResult.data);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.status(200).json(result);
});

// ==========================================
// 9. USER PROFILE (GET & PATCH /api/v1/profile)
// ==========================================
profileRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.userId!);
  if (!user) {
    res.status(404).json({ success: false, message: "Profile not found." });
    return;
  }
  res.status(200).json({ success: true, user });
});

profileRouter.patch("/", requireAuth, async (req: Request, res: Response) => {
  const parseResult = updateProfileRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid profile data";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const updatedUser = await authService.updateProfile(req.userId!, parseResult.data);
  if (!updatedUser) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: updatedUser,
  });
});
