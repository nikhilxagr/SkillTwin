import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../../config.js";
import { authService } from "./auth.service.js";
import { requireAuth, optionalAuth, COOKIE_NAME } from "./auth.middleware.js";
import { oauthService } from "./oauth.service.js";
import type { OAuthProviderType } from "../database/database.types.js";
import {
  signupRequestSchema,
  loginRequestSchema,
  verifyEmailRequestSchema,
  resendVerificationRequestSchema,
  verifyOtpRequestSchema,
  resendOtpRequestSchema,
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
// 5. EMAIL VERIFICATION VIA 6-DIGIT OTP
// ==========================================
authRouter.post("/verify-otp", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = verifyOtpRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid verification code format.";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const result = await authService.verifyEmailOtp(parseResult.data.email, parseResult.data.otp);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  if (result.token) {
    setSessionCookie(res, result.token);
  }

  res.status(200).json(result);
});

authRouter.post("/resend-otp", authRateLimiter, async (req: Request, res: Response) => {
  const parseResult = resendOtpRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Valid email is required.";
    res.status(400).json({ success: false, message: errorMsg });
    return;
  }

  const result = await authService.resendVerificationOtp(parseResult.data.email);
  res.status(200).json(result);
});

// ==========================================
// 6. LEGACY TOKEN EMAIL VERIFICATION (Compatibility)
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
// 9. OAUTH / SOCIAL AUTHENTICATION (Google, GitHub, LinkedIn)
// ==========================================

/**
 * GET /api/auth/providers - Query connected providers for the authenticated user
 */
authRouter.get("/providers", requireAuth, async (req: Request, res: Response) => {
  const data = await authService.getConnectedProviders(req.userId!);
  if (!data) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }
  res.status(200).json({ success: true, ...data });
});

/**
 * DELETE /api/auth/providers/:provider - Safely disconnect an OAuth provider
 */
authRouter.delete(
  "/providers/:provider(google|github|linkedin)",
  requireAuth,
  async (req: Request, res: Response) => {
    const provider = req.params.provider as OAuthProviderType;
    const result = await authService.disconnectProvider(req.userId!, provider);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(200).json(result);
  }
);

/**
 * GET /api/auth/:provider - Initiate OAuth redirect
 */
authRouter.get(
  "/:provider(google|github|linkedin)",
  optionalAuth,
  (req: Request, res: Response) => {
    const provider = req.params.provider as OAuthProviderType;

    if (!oauthService.isConfigured(provider)) {
      const msg = `${provider.toUpperCase()} authentication is not configured yet. Please configure ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in .env`;
      if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
        res.status(400).json({ success: false, message: msg });
        return;
      }
      res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(msg)}`);
      return;
    }

    // Determine intent: link vs login
    const requestedAction = req.query.action === "link" ? "link" : "login";
    let action: "login" | "link" = "login";
    let linkUserId: string | undefined = undefined;

    if (requestedAction === "link") {
      if (!req.userId) {
        const errorMsg = "Please log in before connecting accounts.";
        if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
          res.status(401).json({ success: false, message: errorMsg });
          return;
        }
        res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(errorMsg)}`);
        return;
      }
      action = "link";
      linkUserId = req.userId;
    }

    try {
      const authUrl = oauthService.getAuthorizationUrl(provider, action, linkUserId);
      res.redirect(authUrl);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to initiate OAuth authorization";
      if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
        res.status(500).json({ success: false, message: errorMsg });
        return;
      }
      res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(errorMsg)}`);
    }
  }
);

/**
 * GET /api/auth/:provider/callback - Handle provider authorization callback
 */
authRouter.get(
  "/:provider(google|github|linkedin)/callback",
  async (req: Request, res: Response) => {
    const provider = req.params.provider as OAuthProviderType;

    // Check for provider error (e.g. access_denied)
    if (req.query.error) {
      const errorDesc = String(req.query.error_description || req.query.error || "Authentication cancelled by user.");
      res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(errorDesc)}`);
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      const msg = "Invalid OAuth callback: missing authorization code or state parameter.";
      if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
        res.status(400).json({ success: false, message: msg });
        return;
      }
      res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(msg)}`);
      return;
    }

    try {
      // 1. Verify tamper-proof state
      const statePayload = oauthService.verifyState(state);
      if (statePayload.provider !== provider) {
        throw new Error("OAuth provider mismatch in state parameter.");
      }

      // 2. Exchange code for normalized profile
      const profile = await oauthService.fetchProfile(provider, code);

      // 3. Process account matching/linking logic
      const result = await oauthService.handleOAuthCallback(profile, statePayload);

      if (!result.success) {
        if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
          res.status(400).json(result);
          return;
        }
        if (statePayload.action === "link") {
          res.redirect(`${config.WEB_ORIGIN}/#/profile?oauth_error=${encodeURIComponent(result.message)}`);
          return;
        }
        res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(result.message)}`);
        return;
      }

      // 4. Set secure session cookie
      if (result.token) {
        setSessionCookie(res, result.token);
      }

      // If format=json requested (e.g. from tests)
      if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
        res.status(200).json(result);
        return;
      }

      // 5. Redirect user to appropriate view
      if (statePayload.action === "link") {
        res.redirect(`${config.WEB_ORIGIN}/#/profile?oauth_success=${encodeURIComponent(result.message)}&provider=${provider}`);
      } else {
        res.redirect(`${config.WEB_ORIGIN}/#/dashboard?oauth=success`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to complete social authentication.";
      if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
        res.status(400).json({ success: false, message: errorMsg });
        return;
      }
      res.redirect(`${config.WEB_ORIGIN}/#/login?oauth_error=${encodeURIComponent(errorMsg)}`);
    }
  }
);

// ==========================================
// 10. USER PROFILE (GET & PATCH /api/v1/profile)
// ==========================================
profileRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.userId!);
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
