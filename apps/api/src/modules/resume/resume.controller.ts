import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { resumeService } from "./resume.service.js";
import { DocumentProcessingError } from "../document/document.service.js";
import { optionalAuth, requireAuth } from "../auth/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export const resumeRouter = Router();

// Apply optionalAuth so req.userId is automatically identified if token/cookie is present
resumeRouter.use(optionalAuth);

/**
 * GET /api/v1/resumes
 * List all resumes for the authenticated user
 */
resumeRouter.get("/", (req: Request, res: Response): void => {
  const userId = req.userId || "default-user";
  const resumes = resumeService.listResumes(userId);
  res.json({
    status: "success",
    data: resumes,
  });
});

/**
 * POST /api/v1/resumes/upload
 * Multipart file upload (PDF or TXT)
 */
resumeRouter.post(
  "/upload",
  upload.single("resume"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "No file was uploaded. Please provide a PDF or TXT resume file under field 'resume'.",
      });
      return;
    }

    try {
      const userId = req.userId || "default-user";
      const result = await resumeService.processResumeFile(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        userId
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
 * POST /api/v1/resumes/text
 * Direct plain text payload
 */
resumeRouter.post(
  "/text",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName : "Pasted_Resume.txt";

    if (!text.trim()) {
      res.status(400).json({
        status: "error",
        message: "Request body field 'text' is required.",
      });
      return;
    }

    try {
      const userId = req.userId || "default-user";
      const result = await resumeService.processResumeText(fileName, text, userId);
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
 * GET /api/v1/resumes/latest
 */
resumeRouter.get("/latest", (req: Request, res: Response): void => {
  const latest = resumeService.getLatestResume(req.userId);
  if (!latest) {
    res.status(404).json({ status: "error", message: "No resume has been uploaded yet." });
    return;
  }
  res.json({ status: "success", data: latest });
});

/**
 * GET /api/v1/resumes/:id
 * Strict ownership check: Prevents User B from accessing User A's resume
 */
resumeRouter.get("/:id", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const resume = resumeService.getResume(String(id), req.userId);
  if (!resume) {
    res.status(404).json({ status: "error", message: "Resume not found." });
    return;
  }
  res.json({ status: "success", data: resume });
});

/**
 * DELETE /api/v1/resumes/:id
 * Delete resume belonging to the authenticated user
 */
resumeRouter.delete("/:id", requireAuth, (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = resumeService.deleteResume(String(id), req.userId!);
  if (!deleted) {
    res.status(404).json({ status: "error", message: "Resume not found or not authorized to delete." });
    return;
  }
  res.json({ status: "success", message: "Resume deleted successfully." });
});

/**
 * GET /api/v1/resumes/:id/matrix
 */
resumeRouter.get("/:id/matrix", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const matrix = resumeService.getMatrix(String(id), req.userId);
  if (!matrix) {
    res.status(404).json({ status: "error", message: "Skill matrix not found for this resume." });
    return;
  }
  res.json({ status: "success", data: matrix });
});

/**
 * GET /api/v1/resumes/:id/analysis
 */
resumeRouter.get("/:id/analysis", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const analysis = resumeService.getAnalysis(String(id), req.userId);
  if (!analysis) {
    res.status(404).json({ status: "error", message: "Resume analysis not found for this resume." });
    return;
  }
  res.json({ status: "success", data: analysis });
});
