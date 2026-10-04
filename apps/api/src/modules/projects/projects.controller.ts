import { Router, type Request, type Response } from "express";
import {
  generateBlueprintRequestSchema,
  type JobExtraction,
  type SkillMatrix,
  type GapAnalysisReport,
} from "@skilltwin/contracts";
import { projectService } from "./projects.service.js";

export const projectsRouter = Router();

/**
 * POST /api/v1/projects/recommendations
 * Generates tailored, production-grade project recommendations targeting candidate gaps.
 */
projectsRouter.post("/recommendations", (req: Request, res: Response) => {
  try {
    const job = (req.body?.job as JobExtraction | undefined) ?? null;
    const matrix = (req.body?.matrix as SkillMatrix | undefined) ?? null;
    const gapReport = (req.body?.gapReport as GapAnalysisReport | undefined) ?? null;

    const report = projectService.generateRecommendations({
      job,
      matrix,
      gapReport,
    });

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({
      status: "error",
      code: "PROJECT_RECOMMENDATION_FAILED",
      message: err?.message || "Failed to generate project recommendations.",
    });
  }
});

/**
 * GET /api/v1/projects/latest
 * Retrieves the most recent project recommendations.
 */
projectsRouter.get("/latest", (_req: Request, res: Response) => {
  const latest = projectService.getLatestRecommendations();
  if (!latest) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No project recommendations have been generated yet.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: latest,
  });
});

/**
 * POST /api/v1/projects/blueprint
 * Generates an in-depth Project Blueprint with system topology, code templates, and checklist.
 */
projectsRouter.post("/blueprint", (req: Request, res: Response) => {
  const parsed = generateBlueprintRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_REQUEST",
      message: "A valid 'projectId' is required to generate a project blueprint.",
      errors: parsed.error.issues,
    });
    return;
  }

  try {
    const blueprint = projectService.generateBlueprint(parsed.data.projectId);
    res.status(200).json({
      status: "success",
      data: blueprint,
    });
  } catch (err: any) {
    res.status(404).json({
      status: "error",
      code: "BLUEPRINT_GENERATION_FAILED",
      message: err?.message || "Failed to generate project blueprint.",
    });
  }
});

/**
 * GET /api/v1/projects/blueprint/:projectId
 * Retrieves an existing blueprint for a specific project ID.
 */
projectsRouter.get("/blueprint/:projectId", (req: Request, res: Response) => {
  const rawId = req.params.projectId;
  const projectId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!projectId) {
    res.status(400).json({
      status: "error",
      code: "INVALID_PROJECT_ID",
      message: "Project ID is required.",
    });
    return;
  }

  try {
    const blueprint = projectService.generateBlueprint(projectId);
    res.status(200).json({
      status: "success",
      data: blueprint,
    });
  } catch (err: any) {
    res.status(404).json({
      status: "error",
      code: "BLUEPRINT_NOT_FOUND",
      message: err?.message || `Blueprint for project '${projectId}' not found.`,
    });
  }
});
