import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { recruiterMatchRequestSchema } from "@skilltwin/contracts";
import { publicProfileService } from "./public-profile.service.js";

export const publicRouter = Router();

// Rate limiter for public profile access: 120 requests per minute
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to public dossier. Please try again in a minute.",
  },
});

/**
 * GET /api/v1/public/twin/:username
 * Publicly viewable dossier for a candidate's verified digital twin.
 * No authentication required.
 */
publicRouter.get("/twin/:username", publicRateLimiter, async (req: Request, res: Response) => {
  const rawUsername = String(req.params.username || "");
  if (!rawUsername.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid username is required to view a Verified Twin profile.",
    });
    return;
  }

  try {
    const profile = await publicProfileService.getPublicProfileByUsername(rawUsername);
    if (!profile) {
      res.status(404).json({
        success: false,
        message: `Profile '@${publicProfileService.normalizeUsername(rawUsername)}' not found or is set to private.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to retrieve public profile.",
    });
  }
});

/**
 * POST /api/v1/public/twin/:username/match
 * Interactive Recruiter Tool: Recruiter pastes job description text,
 * and the engine runs live gap and evidence matching against candidate's verified proof points.
 * No authentication required.
 */
publicRouter.post("/twin/:username/match", publicRateLimiter, async (req: Request, res: Response) => {
  const rawUsername = String(req.params.username || "");
  if (!rawUsername.trim()) {
    res.status(400).json({
      success: false,
      message: "A valid username is required to run recruiter fit matching.",
    });
    return;
  }

  const parsed = recruiterMatchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors[0]?.message || "Invalid job description payload.";
    res.status(400).json({
      success: false,
      message: errorMsg,
    });
    return;
  }

  try {
    const matchResult = await publicProfileService.matchRecruiterJd(
      rawUsername,
      parsed.data.jobDescriptionText,
      parsed.data.roleTitle
    );

    if (!matchResult) {
      res.status(404).json({
        success: false,
        message: `Profile '@${publicProfileService.normalizeUsername(rawUsername)}' not found or recruiter matching is disabled by this candidate.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: matchResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to execute recruiter JD match.",
    });
  }
});
