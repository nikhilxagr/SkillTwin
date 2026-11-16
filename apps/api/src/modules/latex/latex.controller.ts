import { Router, Request, Response } from "express";
import {
  latexCompileRequestSchema,
  generateLatexFromResume,
  calculateResumePageBudget,
  type LatexTemplateId,
  type LatexFontId,
  type LatexMargin,
  type ResumeExtraction,
  type JobSpecificTailoredResume,
} from "@skilltwin/contracts";
import { latexService } from "./latex.service.js";

export const latexRouter = Router();

/**
 * GET /api/v1/latex/status
 * Health and engine capabilities check
 */
latexRouter.get("/status", async (_req: Request, res: Response) => {
  const local = await latexService.detectLocalCompiler();
  res.status(200).json({
    status: "ok",
    engines: {
      localAvailable: !!local,
      localType: local?.type || null,
      freeCloudAvailable: true,
      service: "latexonline.cc + local hybrid",
    },
  });
});

/**
 * POST /api/v1/latex/compile
 * Compiles LaTeX source code into standard PDF.
 * Free & ATS-friendly.
 */
latexRouter.post("/compile", async (req: Request, res: Response) => {
  const parsed = latexCompileRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_LATEX_INPUT",
      message: "Invalid LaTeX compilation request.",
      errors: parsed.error.issues,
    });
    return;
  }

  const { texSource, engine } = parsed.data;

  try {
    const result = await latexService.compileLatex(texSource, engine);

    // If client requested raw binary download via header or query
    if (req.headers.accept?.includes("application/pdf") || req.query.download === "true") {
      const pdfBuffer = Buffer.from(result.pdfBase64, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
      res.setHeader("Content-Length", pdfBuffer.length);
      res.status(200).send(pdfBuffer);
      return;
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    res.status(422).json({
      status: "error",
      code: "LATEX_COMPILATION_FAILED",
      message: err.message || "Failed to compile LaTeX document.",
      log: err.log || null,
    });
  }
});

/**
 * POST /api/v1/latex/generate
 * Generates ATS-friendly LaTeX source code with multi-template & font support.
 */
latexRouter.post("/generate", async (req: Request, res: Response) => {
  const resume = req.body?.resume as ResumeExtraction | undefined;
  if (!resume || !resume.profile) {
    res.status(400).json({
      status: "error",
      code: "MISSING_RESUME_DATA",
      message: "A valid ResumeExtraction object is required to generate LaTeX source code.",
    });
    return;
  }

  const tailored = req.body?.tailored as JobSpecificTailoredResume | undefined;
  const templateId = (req.body?.templateId as LatexTemplateId) || "jakes-resume";
  const font = (req.body?.font as LatexFontId) || (templateId === "minimal-ats" ? "helvetica" : "computer-modern");
  const margin = (req.body?.margin as LatexMargin) || "normal";

  try {
    const texSource = generateLatexFromResume(resume, {
      templateId,
      font,
      margin,
      tailored: tailored || null,
    });

    const pageBudget = calculateResumePageBudget(resume, {
      templateId,
      margin,
      tailored: tailored || null,
    });

    res.status(200).json({
      status: "success",
      data: {
        texSource,
        templateId,
        font,
        margin,
        pageBudget,
        atsFriendly: true,
        features: [
          "Single-column layout (100% ATS parser compliant)",
          "glyphtounicode enabled for clean text extraction",
          "Standard section headings (Education, Experience, Projects, Skills)",
          "No tables or multi-column floats that break ATS parsers",
          `Template: ${templateId} with ${font} font and ${margin} margins`,
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      code: "LATEX_GENERATION_FAILED",
      message: err.message || "Failed to generate LaTeX document from resume data.",
    });
  }
});

/**
 * POST /api/v1/latex/budget
 * Analyzes resume content density and returns 1-page fit prediction.
 */
latexRouter.post("/budget", async (req: Request, res: Response) => {
  const resume = req.body?.resume as ResumeExtraction | undefined;
  if (!resume || !resume.profile) {
    res.status(400).json({
      status: "error",
      code: "MISSING_RESUME_DATA",
      message: "A valid ResumeExtraction object is required to analyze page budget.",
    });
    return;
  }

  const tailored = req.body?.tailored as JobSpecificTailoredResume | undefined;
  const templateId = (req.body?.templateId as LatexTemplateId) || "jakes-resume";
  const margin = (req.body?.margin as LatexMargin) || "normal";

  const budget = calculateResumePageBudget(resume, {
    templateId,
    margin,
    tailored: tailored || null,
  });

  res.status(200).json({
    status: "success",
    data: budget,
  });
});
