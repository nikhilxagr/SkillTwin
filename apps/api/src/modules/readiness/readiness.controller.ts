import { Router, type Request, type Response } from "express";
import {
  computeCareerReadiness,
  skillMatrixSchema,
  type CareerReadinessReport,
  type GapAnalysisReport,
  type JobExtraction,
  type ResumeExtraction,
} from "@skilltwin/contracts";

export const readinessRouter = Router();

let latestReport: CareerReadinessReport | null = null;

/**
 * POST /api/v1/readiness/evaluate
 * Compute a deterministic Career Readiness report from the Skill Matrix
 * plus optional resume, job description and gap analysis.
 */
readinessRouter.post("/evaluate", (req: Request, res: Response) => {
  const parsedMatrix = skillMatrixSchema.safeParse(req.body?.matrix);
  if (!parsedMatrix.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_INPUT",
      message: "A valid 'matrix' (Skill Matrix) is required to evaluate career readiness.",
    });
    return;
  }

  try {
    const report = computeCareerReadiness({
      matrix: parsedMatrix.data,
      resume: (req.body.resume as ResumeExtraction | undefined) ?? null,
      job: (req.body.job as JobExtraction | undefined) ?? null,
      gapReport: (req.body.gapReport as GapAnalysisReport | undefined) ?? null,
    });
    latestReport = report;
    res.status(200).json({ status: "success", data: report });
  } catch (err: any) {
    res.status(400).json({
      status: "error",
      code: "READINESS_EVALUATION_FAILED",
      message: err?.message || "Failed to evaluate career readiness.",
    });
  }
});

/**
 * GET /api/v1/readiness/latest
 * Retrieve the most recently computed readiness report.
 */
readinessRouter.get("/latest", (_req: Request, res: Response) => {
  if (!latestReport) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No career readiness report has been computed yet.",
    });
    return;
  }
  res.status(200).json({ status: "success", data: latestReport });
});
