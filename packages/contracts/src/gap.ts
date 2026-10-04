import { z } from "zod";
import { skillCategorySchema, skillProficiencySchema } from "./skills.js";
import { jobImportanceSchema, roleProfileSchema } from "./job.js";

export const gapCategorySchema = z.enum([
  "MATCH",
  "PARTIAL",
  "GAP",
  "WEAK_EVIDENCE",
  "OPTIONAL_GAP",
]);
export type GapCategory = z.infer<typeof gapCategorySchema>;

export const comparisonItemSchema = z.object({
  canonicalName: z.string().min(1),
  category: skillCategorySchema,
  status: gapCategorySchema,
  importance: jobImportanceSchema,
  candidateProficiency: z.union([skillProficiencySchema, z.literal("Not Detected")]),
  requiredProficiency: skillProficiencySchema,
  candidateConfidence: z.number().min(0).max(100),
  evidenceCount: z.number().int().nonnegative(),
  evidenceSummary: z.string(),
  gapRationale: z.string(),
  suggestedAction: z.string(),
});
export type ComparisonItem = z.infer<typeof comparisonItemSchema>;

export const gapAnalysisSummarySchema = z.object({
  totalRequired: z.number().int().nonnegative(),
  totalPreferred: z.number().int().nonnegative(),
  matchCount: z.number().int().nonnegative(),
  partialCount: z.number().int().nonnegative(),
  criticalGapCount: z.number().int().nonnegative(),
  weakEvidenceCount: z.number().int().nonnegative(),
  optionalGapCount: z.number().int().nonnegative(),
  alignmentRating: z.enum(["Strong", "Moderate", "Developing", "Low"]),
  alignmentScore: z.number().min(0).max(100),
  alignmentExplanation: z.string().min(1),
});
export type GapAnalysisSummary = z.infer<typeof gapAnalysisSummarySchema>;

export const gapAnalysisReportSchema = z.object({
  id: z.string().min(1),
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  targetRole: z.string().min(1),
  company: z.string().optional(),
  summary: gapAnalysisSummarySchema,
  criticalGaps: z.array(comparisonItemSchema).default([]),
  partialGaps: z.array(comparisonItemSchema).default([]),
  weakEvidence: z.array(comparisonItemSchema).default([]),
  strongMatches: z.array(comparisonItemSchema).default([]),
  optionalGaps: z.array(comparisonItemSchema).default([]),
  generatedAt: z.string().datetime(),
});
export type GapAnalysisReport = z.infer<typeof gapAnalysisReportSchema>;

// Backward compatibility schemas
export const gapResultSchema = z.object({
  skill: z.string(),
  currentEstimate: z.number().min(0).max(100),
  targetEstimate: z.number().min(0).max(100),
  status: z.enum(["strong", "developing", "gap", "missing_evidence"]),
  rationale: z.string(),
  importance: z.enum(["required", "important", "useful"]),
});
export const gapAnalysisSchema = z.object({
  role: roleProfileSchema,
  results: z.array(gapResultSchema),
  disclaimer: z.string(),
});
export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

export const roadmapItemSchema = z.object({
  week: z.number().int().positive(),
  skill: z.string(),
  objective: z.string(),
  tasks: z.array(z.string()),
  expectedEvidence: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
});
export const roadmapSchema = z.object({
  role: roleProfileSchema,
  items: z.array(roadmapItemSchema),
  disclaimer: z.string(),
});
export type Roadmap = z.infer<typeof roadmapSchema>;
