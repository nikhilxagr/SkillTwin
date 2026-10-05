import { Router, type Request, type Response } from "express";
import { optimizerService } from "./optimizer.service.js";
import { optionalAuth } from "../auth/auth.middleware.js";

export const optimizerRouter = Router();

optimizerRouter.use(optionalAuth);

/**
 * POST /api/v1/optimizer/optimize
 * Generate an evidence-grounded resume optimization report.
 */
optimizerRouter.post("/optimize", async (req: Request, res: Response) => {
  try {
    const { resume, matrix, job, gapReport, resumeId, jobId } = req.body;

    const report = await optimizerService.optimize(
      {
        resume,
        matrix,
        job,
        gapReport,
        resumeId,
        jobId,
      },
      req.userId
    );

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err: any) {
    const isNotFound = err.message?.includes("not found");
    res.status(isNotFound ? 404 : 400).json({
      status: "error",
      code: isNotFound ? "NOT_FOUND" : "OPTIMIZATION_FAILED",
      message: err.message || "Failed to generate resume optimization report.",
    });
  }
});

/**
 * GET /api/v1/optimizer/latest
 * Retrieve the latest computed optimization report.
 */
optimizerRouter.get("/latest", (_req: Request, res: Response) => {
  const report = optimizerService.getLatestReport();
  if (!report) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No resume optimization report has been generated yet.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});

/**
 * GET /api/v1/optimizer/:id
 * Retrieve a specific optimization report by ID.
 */
optimizerRouter.get("/:id", (req: Request, res: Response) => {
  const reportId = String(req.params.id);
  const report = optimizerService.getReport(reportId);
  if (!report) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: `Resume optimization report '${reportId}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});

/**
 * POST /api/v1/optimizer/tailor
 * Generate a job-specific tailored resume recommendation (Phase 7).
 */
optimizerRouter.post("/tailor", async (req: Request, res: Response) => {
  try {
    const { resume, matrix, job, gapReport, resumeId, jobId } = req.body;

    const tailored = await optimizerService.tailor(
      {
        resume,
        matrix,
        job,
        gapReport,
        resumeId,
        jobId,
      },
      req.userId
    );

    res.status(200).json({
      status: "success",
      data: tailored,
    });
  } catch (err: any) {
    const isNotFound = err.message?.includes("not found");
    res.status(isNotFound ? 404 : 400).json({
      status: "error",
      code: isNotFound ? "NOT_FOUND" : "TAILORING_FAILED",
      message: err.message || "Failed to generate job-specific tailored resume.",
    });
  }
});

/**
 * GET /api/v1/optimizer/tailored/latest
 * Retrieve the latest job-specific tailored resume.
 */
optimizerRouter.get("/tailored/latest", (_req: Request, res: Response) => {
  const tailored = optimizerService.getLatestTailoredResume();
  if (!tailored) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No job-specific tailored resume has been generated yet.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: tailored,
  });
});

/**
 * GET /api/v1/optimizer/tailored/:id
 * Retrieve a specific job-specific tailored resume by ID.
 */
optimizerRouter.get("/tailored/:id", (req: Request, res: Response) => {
  const tailoredId = String(req.params.id);
  const tailored = optimizerService.getTailoredResume(tailoredId);
  if (!tailored) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: `Job-specific tailored resume '${tailoredId}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: tailored,
  });
});

