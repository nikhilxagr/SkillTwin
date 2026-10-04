import { z } from "zod";
import { skillAssessmentSchema, skillMatrixSchema } from "./skills.js";
import { jobExtractionSchema, roleProfileSchema } from "./job.js";
import { gapAnalysisReportSchema } from "./gap.js";
import { resumeOptimizationReportSchema } from "./optimization.js";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("skilltwin-api"),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const savedCareerAnalysisSchema = z.object({
  id: z.string().min(1),
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  company: z.string().optional(),
  alignmentRating: z.enum(["Strong", "Moderate", "Developing", "Low"]),
  alignmentScore: z.number().min(0).max(100),
  matrix: skillMatrixSchema,
  job: jobExtractionSchema,
  gapReport: gapAnalysisReportSchema,
  optimization: resumeOptimizationReportSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});
export type SavedCareerAnalysis = z.infer<typeof savedCareerAnalysisSchema>;

// Backward compatibility schemas
export const interviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  focusSkill: z.string(),
  projectContext: z.string(),
  whyThisQuestion: z.string(),
});
export const interviewEvaluationSchema = z.object({
  technicalUnderstanding: z.number().min(0).max(5),
  accuracy: z.number().min(0).max(5),
  depth: z.number().min(0).max(5),
  communication: z.number().min(0).max(5),
  feedback: z.string(),
  followUp: z.string(),
  evidenceNote: z.string(),
});
export const interviewSessionSchema = z.object({
  id: z.string(),
  role: roleProfileSchema,
  questions: z.array(interviewQuestionSchema),
  disclaimer: z.string(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;

export const evolutionChangeSchema = z.object({
  skill: z.string(),
  previousEstimate: z.number().min(0).max(100),
  currentEstimate: z.number().min(0).max(100),
  evidenceChange: z.string(),
  interpretation: z.string(),
});
export const evolutionSnapshotSchema = z.object({
  id: z.string(),
  analyzedAt: z.string(),
  label: z.string(),
  evidenceConfidence: z.number().min(0).max(100),
  skillsTracked: z.number().int().nonnegative(),
});
export const evolutionSchema = z.object({
  snapshots: z.array(evolutionSnapshotSchema),
  changes: z.array(evolutionChangeSchema),
  newEvidence: z.array(z.string()),
  remainingGaps: z.array(z.string()),
  disclaimer: z.string(),
});
export type Evolution = z.infer<typeof evolutionSchema>;

export const githubRepositoryEvidenceSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  languages: z.array(z.string()),
  topics: z.array(z.string()),
  signals: z.object({
    readme: z.enum(["missing", "basic", "documented"]),
    testing: z.enum(["not_detected", "partial", "present"]),
    documentation: z.enum(["not_detected", "partial", "present"]),
    activity: z.enum(["low", "steady", "active"]),
  }),
  evidenceSummary: z.string(),
});
export const githubStatusSchema = z.object({
  mode: z.enum(["demo", "oauth"]),
  connected: z.boolean(),
  username: z.string().nullable(),
  scopes: z.array(z.string()),
  message: z.string(),
});
export const githubSyncSchema = z.object({
  status: z.enum(["completed", "partial", "failed"]),
  repositoriesAnalyzed: z.number().int().nonnegative(),
  evidence: z.array(githubRepositoryEvidenceSchema),
  limitations: z.array(z.string()),
});
export type GithubStatus = z.infer<typeof githubStatusSchema>;
export type GithubSync = z.infer<typeof githubSyncSchema>;

export const analysisResultSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  provider: z.enum(["deterministic-demo", "external-ai"]),
  status: z.enum(["completed", "partial"]),
  assessments: z.array(skillAssessmentSchema),
  evidenceCount: z.number().int().nonnegative(),
  limitations: z.array(z.string()),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const analysisSummarySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  provider: z.enum(["deterministic-demo", "external-ai"]),
  status: z.enum(["completed", "partial"]),
  evidenceCount: z.number().int().nonnegative(),
});
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;
