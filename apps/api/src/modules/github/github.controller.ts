import { Router, type Request, type Response } from "express";
import {
  githubConnectRequestSchema,
  type ResumeExtraction,
  type SkillMatrix,
  type AnalyzedRepository,
} from "@skilltwin/contracts";
import { githubService, SAMPLE_ALEX_REPOS } from "./github.service.js";
import { demoGithubSync, githubStatus } from "../../github.js";

export const githubRouter = Router();

/**
 * GET /api/v1/github/status
 * Backward-compatible & Phase 11 status endpoint.
 */
githubRouter.get("/status", (_req: Request, res: Response) => {
  const latest = githubService.getLatestReport();
  res.status(200).json({
    mode: "demo",
    connected: latest !== null,
    username: latest?.username || null,
    scopes: [],
    message: latest
      ? `Connected to GitHub as ${latest.username}. ${latest.totalRepositories} repositories analyzed.`
      : githubStatus.message,
    repositoriesCount: latest?.totalRepositories || 0,
  });
});

/**
 * POST /api/v1/github/sync
 * Backward-compatible sync endpoint returning repository signals and report.
 */
githubRouter.post("/sync", async (req: Request, res: Response) => {
  const username = req.body?.username || githubService.getStatus().username || "alexrivera-dev";
  const token = req.body?.token;
  const resume = (req.body?.resume as ResumeExtraction | undefined) ?? null;
  const matrix = (req.body?.matrix as SkillMatrix | undefined) ?? null;

  try {
    const report = await githubService.connectAndAnalyze({
      username,
      token,
      resume,
      matrix,
    });

    res.status(200).json({
      status: "partial",
      repositoriesAnalyzed: report.totalRepositories,
      evidence: demoGithubSync.evidence,
      limitations: demoGithubSync.limitations,
      report,
    });
  } catch {
    res.status(200).json(demoGithubSync);
  }
});

/**
 * POST /api/v1/github/connect
 * Phase 11: Connects via authorized GitHub API (no scraping) and generates cross-verified evidence report.
 */
githubRouter.post("/connect", async (req: Request, res: Response) => {
  const parsed = githubConnectRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_REQUEST",
      message: "A valid 'username' is required to connect GitHub.",
      errors: parsed.error.issues,
    });
    return;
  }

  try {
    const resume = (req.body?.resume as ResumeExtraction | undefined) ?? null;
    const matrix = (req.body?.matrix as SkillMatrix | undefined) ?? null;

    const report = await githubService.connectAndAnalyze({
      username: parsed.data.username,
      token: parsed.data.token,
      resume,
      matrix,
    });

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({
      status: "error",
      code: "GITHUB_CONNECTION_FAILED",
      message: err?.message || "Failed to analyze GitHub repositories.",
    });
  }
});

/**
 * POST /api/v1/github/compare
 * Phase 11: Compares arbitrary analyzed repositories against resume claims.
 */
githubRouter.post("/compare", async (req: Request, res: Response) => {
  const username = req.body?.username || "alexrivera-dev";
  const resume = (req.body?.resume as ResumeExtraction | undefined) ?? null;
  const matrix = (req.body?.matrix as SkillMatrix | undefined) ?? null;
  const customRepos = (req.body?.repositories as AnalyzedRepository[] | undefined) ?? SAMPLE_ALEX_REPOS;

  try {
    const report = await githubService.connectAndAnalyze({
      username,
      token: req.body?.token,
      resume,
      matrix,
    });

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({
      status: "error",
      code: "COMPARISON_FAILED",
      message: err?.message || "Failed to compare GitHub evidence.",
    });
  }
});

/**
 * GET /api/v1/github/report/latest
 * Phase 11: Retrieves the most recent GitHub evidence comparison report.
 */
githubRouter.get("/report/latest", (_req: Request, res: Response) => {
  const report = githubService.getLatestReport();
  if (!report) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No GitHub evidence report has been generated yet.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});

/**
 * GET /api/v1/github/repositories
 * Phase 11: Lists analyzed repositories.
 */
githubRouter.get("/repositories", (_req: Request, res: Response) => {
  const report = githubService.getLatestReport();
  const repos = report?.analyzedRepositories || SAMPLE_ALEX_REPOS;
  res.status(200).json({
    status: "success",
    data: repos,
  });
});
