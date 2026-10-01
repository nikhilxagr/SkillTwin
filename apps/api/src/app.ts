import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import { healthResponseSchema } from "@skilltwin/contracts";
import { config } from "./config.js";
import { demoTwin } from "./demo-twin.js";
import { getGapAnalysis, getRoadmap, roles } from "./roles.js";
import { demoInterview, evaluateDemoAnswer } from "./interview.js";
import { demoEvolution } from "./evolution.js";
import multer from "multer";
import { parseResume } from "./resume.js";
import { demoGithubSync, githubStatus } from "./github.js";
import { intelligenceProvider } from "./ai.js";
import { analysisRepository } from "./analysis-repository.js";

export const app = express();
const logger = pino();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => callback(null, file.mimetype === "application/pdf"),
});

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use((request, _response, next) => {
  logger.info({ method: request.method, path: request.path }, "request");
  next();
});

app.get("/health", (_request, response) => {
  response.json(
    healthResponseSchema.parse({
      status: "ok",
      service: "skilltwin-api",
      timestamp: new Date().toISOString(),
    }),
  );
});

app.get("/api/v1/demo/twin", (_request, response) => {
  response.json(demoTwin);
});

app.get("/api/v1/roles", (_request, response) => response.json(roles));
app.get("/api/v1/gap-analysis", (request, response) => {
  const analysis = getGapAnalysis(String(request.query.roleId ?? "full-stack-developer"));
  if (!analysis) {
    response.status(404).json({ error: "Role not found" });
    return;
  }
  response.json(analysis);
});
app.get("/api/v1/roadmap", (request, response) => {
  const roadmap = getRoadmap(String(request.query.roleId ?? "full-stack-developer"));
  if (!roadmap) {
    response.status(404).json({ error: "Role not found" });
    return;
  }
  response.json(roadmap);
});
app.get("/api/v1/interviews/demo", (_request, response) => response.json(demoInterview));
app.post("/api/v1/interviews/demo/evaluate", (request, response) => {
  const answer = typeof request.body?.answer === "string" ? request.body.answer : "";
  if (!answer.trim()) {
    response.status(400).json({ error: "Answer is required" });
    return;
  }
  response.json(evaluateDemoAnswer(answer));
});
app.get("/api/v1/evolution", (_request, response) => response.json(demoEvolution));
app.post("/api/v1/resume", upload.single("resume"), async (request, response, next) => {
  if (!request.file) {
    response.status(400).json({ error: "A PDF resume file is required" });
    return;
  }
  try {
    response.status(201).json(await parseResume(request.file.originalname, request.file.buffer));
  } catch (error) {
    next(error);
  }
});
app.get("/api/v1/github/status", (_request, response) => response.json(githubStatus));
app.post("/api/v1/github/sync", (_request, response) => response.json(demoGithubSync));
app.post("/api/v1/analyses", (request, response) => {
  const resumeStatements = Array.isArray(request.body?.resumeStatements)
    ? request.body.resumeStatements.filter((statement: unknown): statement is string => typeof statement === "string")
    : [];
  const analysis = intelligenceProvider.analyze({ resumeStatements });
  analysisRepository.save(analysis);
  response.status(201).json(analysis);
});
app.get("/api/v1/analyses", (_request, response) => response.json(analysisRepository.list()));
app.get("/api/v1/analyses/:id", (request, response) => {
  const analysis = analysisRepository.get(request.params.id);
  if (!analysis) {
    response.status(404).json({ error: "Analysis not found" });
    return;
  }
  response.json(analysis);
});

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  logger.error(error);
  response.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
