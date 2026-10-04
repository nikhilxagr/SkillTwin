import { Router, type Request, type Response } from "express";
import { optimizerService } from "./optimizer.service.js";

export const optimizerRouter = Router();

/**
 * POST /api/v1/optimizer/optimize
 * Generate an evidence-grounded resume optimization report.
 */
optimizerRouter.post("/optimize", async (req: Request, res: Response) => {
  try {
    const { resume, matrix, job, gapReport, resumeId, jobId } = req.body;

    const report = await optimizerService.optimize({
      resume,
      matrix,
      job,
      gapReport,
      resumeId,
      jobId,
    });

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
