import { Router, type Request, type Response } from "express";
import { gapService } from "./gap.service.js";

export const gapRouter = Router();

/**
 * POST /api/v1/gap/compare
 * Run deterministic gap comparison between a Skill Matrix and a Job Description.
 */
gapRouter.post("/compare", async (req: Request, res: Response) => {
  try {
    const { matrix, job, resumeId, jobId } = req.body;

    if (!matrix && !resumeId) {
      res.status(400).json({
        status: "error",
        code: "INVALID_INPUT",
        message: "Missing 'matrix' object or 'resumeId'.",
      });
      return;
    }

    if (!job && !jobId) {
      res.status(400).json({
        status: "error",
        code: "INVALID_INPUT",
        message: "Missing 'job' object or 'jobId'.",
      });
      return;
    }

    const report = await gapService.compare({ matrix, job, resumeId, jobId });

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err: any) {
    const isNotFound = err.message?.includes("not found");
    res.status(isNotFound ? 404 : 400).json({
      status: "error",
      code: isNotFound ? "NOT_FOUND" : "GAP_COMPARISON_FAILED",
      message: err.message || "Failed to execute gap comparison.",
    });
  }
});

/**
 * GET /api/v1/gap/latest
 * Retrieve the latest computed gap analysis report.
 */
gapRouter.get("/latest", (_req: Request, res: Response) => {
  const report = gapService.getLatestReport();
  if (!report) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No gap analysis has been performed yet.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});

/**
 * GET /api/v1/gap/:id
 * Retrieve a specific gap analysis report by ID.
 */
gapRouter.get("/:id", (req: Request, res: Response) => {
  const reportId = String(req.params.id);
  const report = gapService.getReport(reportId);
  if (!report) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: `Gap analysis report '${reportId}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});
