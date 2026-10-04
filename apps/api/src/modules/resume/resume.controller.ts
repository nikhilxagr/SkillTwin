import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { resumeService } from "./resume.service.js";
import { DocumentProcessingError } from "../document/document.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export const resumeRouter = Router();

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
      const result = await resumeService.processResumeFile(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype
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
      const result = await resumeService.processResumeText(fileName, text);
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
resumeRouter.get("/latest", (_req: Request, res: Response): void => {
  const latest = resumeService.getLatestResume();
  if (!latest) {
    res.status(404).json({ status: "error", message: "No resume has been uploaded yet." });
    return;
  }
  res.json({ status: "success", data: latest });
});

/**
 * GET /api/v1/resumes/:id
 */
resumeRouter.get("/:id", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const resume = resumeService.getResume(String(id));
  if (!resume) {
    res.status(404).json({ status: "error", message: "Resume not found." });
    return;
  }
  res.json({ status: "success", data: resume });
});

/**
 * GET /api/v1/resumes/:id/matrix
 */
resumeRouter.get("/:id/matrix", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const matrix = resumeService.getMatrix(String(id));
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
  const analysis = resumeService.getAnalysis(String(id));
  if (!analysis) {
    res.status(404).json({ status: "error", message: "Resume analysis not found for this resume." });
    return;
  }
  res.json({ status: "success", data: analysis });
});
