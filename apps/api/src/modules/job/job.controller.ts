import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { jobService } from "./job.service.js";
import { DocumentProcessingError } from "../document/document.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export const jobRouter = Router();

/**
 * POST /api/v1/jobs/upload
 * Multipart file upload for Job Description (PDF or TXT)
 */
jobRouter.post(
  "/upload",
  upload.single("job"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "No file was uploaded. Please provide a PDF or TXT job description file under field 'job'.",
      });
      return;
    }

    const fallbackTitle = typeof req.body?.title === "string" ? req.body.title : undefined;
    const fallbackCompany = typeof req.body?.company === "string" ? req.body.company : undefined;

    try {
      const result = await jobService.processJobFile(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        fallbackTitle,
        fallbackCompany
      );

      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (err: any) {
      if (err instanceof DocumentProcessingError) {
        res.status(400).json({
          status: "error",
          code: err.code,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/v1/jobs/text
 * Direct plain text job description payload
 */
jobRouter.post(
  "/text",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    const title = typeof req.body?.title === "string" ? req.body.title : "Target Role";
    const company = typeof req.body?.company === "string" ? req.body.company : "";

    if (!text.trim()) {
      res.status(400).json({
        status: "error",
        message: "Request body field 'text' is required.",
      });
      return;
    }

    try {
      const result = await jobService.processJobText(title, company, text);
      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (err: any) {
      if (err instanceof DocumentProcessingError) {
        res.status(400).json({
          status: "error",
          code: err.code,
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/v1/jobs/latest
 */
jobRouter.get("/latest", (_req: Request, res: Response): void => {
  const latest = jobService.getLatestJob();
  if (!latest) {
    res.status(404).json({ status: "error", message: "No job description has been analyzed yet." });
    return;
  }
  const analysis = jobService.getAnalysis(latest.id);
  res.json({ status: "success", data: { job: latest, analysis } });
});

/**
 * GET /api/v1/jobs/:id
 */
jobRouter.get("/:id", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = jobService.getJob(String(id));
  if (!job) {
    res.status(404).json({ status: "error", message: "Job description not found." });
    return;
  }
  res.json({ status: "success", data: job });
});

/**
 * GET /api/v1/jobs/:id/analysis
 */
jobRouter.get("/:id/analysis", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const analysis = jobService.getAnalysis(String(id));
  if (!analysis) {
    res.status(404).json({ status: "error", message: "Job analysis not found." });
    return;
  }
  res.json({ status: "success", data: analysis });
});
