import { Router, type Request, type Response } from "express";
import {
  startInterviewRequestSchema,
  submitAnswerRequestSchema,
  completeInterviewRequestSchema,
} from "@skilltwin/contracts";
import { simulatorService } from "./simulator.service.js";

export const simulatorRouter = Router();

/**
 * POST /api/v1/simulator/start
 * Start a new grounded interview simulation session.
 */
simulatorRouter.post("/start", (req: Request, res: Response) => {
  const parsed = startInterviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_INPUT",
      message: parsed.error.issues.map((i) => i.message).join(", "),
    });
    return;
  }

  try {
    const session = simulatorService.startInterview(parsed.data);
    res.status(201).json({
      status: "success",
      data: session,
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      code: "START_SESSION_FAILED",
      message: err?.message || "Failed to start interview session.",
    });
  }
});

/**
 * POST /api/v1/simulator/answer
 * Submit an answer to the current interview question and receive adaptive feedback.
 */
simulatorRouter.post("/answer", (req: Request, res: Response) => {
  const parsed = submitAnswerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_INPUT",
      message: parsed.error.issues.map((i) => i.message).join(", "),
    });
    return;
  }

  try {
    const result = simulatorService.submitAnswer(parsed.data);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    const isNotFound = err?.message?.includes("not found");
    const isCompleted = err?.message?.includes("completed");
    res.status(isNotFound ? 404 : isCompleted ? 400 : 500).json({
      status: "error",
      code: "SUBMIT_ANSWER_FAILED",
      message: err?.message || "Failed to evaluate interview answer.",
    });
  }
});

/**
 * POST /api/v1/simulator/complete
 * Conclude the interview session and generate the final readiness report.
 */
simulatorRouter.post("/complete", (req: Request, res: Response) => {
  const parsed = completeInterviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      code: "INVALID_INPUT",
      message: parsed.error.issues.map((i) => i.message).join(", "),
    });
    return;
  }

  try {
    const session = simulatorService.completeInterview(parsed.data.sessionId);
    res.status(200).json({
      status: "success",
      data: session,
    });
  } catch (err: any) {
    const isNotFound = err?.message?.includes("not found");
    res.status(isNotFound ? 404 : 500).json({
      status: "error",
      code: "COMPLETE_SESSION_FAILED",
      message: err?.message || "Failed to complete interview session.",
    });
  }
});

/**
 * GET /api/v1/simulator/history
 * List historical interview sessions.
 */
simulatorRouter.get("/history", (_req: Request, res: Response) => {
  try {
    const history = simulatorService.getHistory();
    res.status(200).json({
      status: "success",
      data: history,
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      code: "GET_HISTORY_FAILED",
      message: err?.message || "Failed to retrieve interview history.",
    });
  }
});

/**
 * GET /api/v1/simulator/latest
 * Retrieve the latest active or completed session.
 */
simulatorRouter.get("/latest", (_req: Request, res: Response) => {
  const session = simulatorService.getLatestSession();
  if (!session) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "No interview session found.",
    });
    return;
  }
  res.status(200).json({
    status: "success",
    data: session,
  });
});

/**
 * GET /api/v1/simulator/session/:id
 * Retrieve a specific interview session by ID.
 */
simulatorRouter.get("/session/:id", (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = simulatorService.getSession(String(sessionId));
  if (!session) {
    res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: `Interview session '${sessionId}' not found.`,
    });
    return;
  }
  res.status(200).json({
    status: "success",
    data: session,
  });
});
