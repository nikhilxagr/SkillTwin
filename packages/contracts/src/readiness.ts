import { z } from "zod";
import { skillCategorySchema } from "./skills.js";
import { jobImportanceSchema } from "./job.js";

/**
 * Phase 8: Career Readiness contracts.
 *
 * Every value in a readiness report is derived deterministically from the
 * candidate's Skill Matrix, the selected Job Description and the Gap Analysis.
 * Nothing here is estimated or invented — each section carries the data it
 * was computed from so the UI can explain itself.
 */

export const careerReadinessRatingSchema = z.enum([
  "Job Ready",
  "Competitive",
  "Developing",
  "Needs Targeted Prep",
]);
export type CareerReadinessRating = z.infer<typeof careerReadinessRatingSchema>;

export const readinessScoreBreakdownSchema = z.object({
  alignmentComponent: z.number(),
  coverageComponent: z.number(),
  evidenceComponent: z.number(),
  criticalGapPenalty: z.number(),
  formula: z.string().min(1),
  hasJobContext: z.boolean(),
});
export type ReadinessScoreBreakdown = z.infer<typeof readinessScoreBreakdownSchema>;

export const readinessSkillCoverageSchema = z.object({
  overallPercentage: z.number().min(0).max(100),
  requiredPercentage: z.number().min(0).max(100),
  preferredPercentage: z.number().min(0).max(100),
  requiredTotal: z.number().int().nonnegative(),
  requiredCovered: z.number().int().nonnegative(),
  preferredTotal: z.number().int().nonnegative(),
  preferredCovered: z.number().int().nonnegative(),
  criticalGapsCount: z.number().int().nonnegative(),
});
export type ReadinessSkillCoverage = z.infer<typeof readinessSkillCoverageSchema>;

export const readinessAreaItemSchema = z.object({
  id: z.string().min(1),
  areaName: z.string().min(1),
  category: skillCategorySchema,
  skills: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
  demonstratedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  status: z.enum(["STRONG", "DEVELOPING", "WEAK"]),
  evidenceSummary: z.string().min(1),
  jobRelevant: z.boolean(),
});
export type ReadinessAreaItem = z.infer<typeof readinessAreaItemSchema>;

export const evidenceTierSchema = z.object({
  tier: z.enum(["work_experience", "project", "education_certification", "claimed_only"]),
  label: z.string().min(1),
  skillCount: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  skills: z.array(z.string()),
});
export type EvidenceTier = z.infer<typeof evidenceTierSchema>;

export const evidenceStrengthDistributionSchema = z.object({
  tiers: z.array(evidenceTierSchema),
  averageConfidence: z.number().min(0).max(100),
  totalSkills: z.number().int().nonnegative(),
  totalEvidenceItems: z.number().int().nonnegative(),
  singleSourceSkillCount: z.number().int().nonnegative(),
});
export type EvidenceStrengthDistribution = z.infer<typeof evidenceStrengthDistributionSchema>;

export const topJobGapItemSchema = z.object({
  id: z.string().min(1),
  skill: z.string().min(1),
  category: skillCategorySchema,
  importance: jobImportanceSchema,
  status: z.enum(["GAP", "PARTIAL", "WEAK_EVIDENCE"]),
  requiredProficiency: z.string(),
  currentProficiency: z.string(),
  priorityLevel: z.enum(["Critical", "High", "Medium", "Low"]),
  priorityScore: z.number().min(0).max(100),
  gapRationale: z.string().min(1),
  actionTip: z.string().min(1),
});
export type TopJobGapItem = z.infer<typeof topJobGapItemSchema>;

export const nextBestActionSchema = z.object({
  id: z.string().min(1),
  rank: z.number().int().positive(),
  title: z.string().min(1),
  category: z.string().min(1),
  priority: z.enum(["Critical", "High", "Recommended"]),
  relatedSkills: z.array(z.string()),
  whyItMatters: z.string().min(1),
  evidenceBasis: z.string().min(1),
  actionSteps: z.array(z.string()).min(1),
  targetScreen: z.string().min(1),
  actionButtonText: z.string().min(1),
});
export type NextBestAction = z.infer<typeof nextBestActionSchema>;

export const careerReadinessReportSchema = z.object({
  id: z.string().min(1),
  candidateName: z.string().min(1),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  overallScore: z.number().min(0).max(100),
  overallRating: careerReadinessRatingSchema,
  scoreBreakdown: readinessScoreBreakdownSchema,
  executiveSummary: z.string().min(1),
  skillCoverage: readinessSkillCoverageSchema,
  strongestAreas: z.array(readinessAreaItemSchema),
  weakestAreas: z.array(readinessAreaItemSchema),
  topJobGaps: z.array(topJobGapItemSchema),
  evidenceStrength: evidenceStrengthDistributionSchema,
  nextBestActions: z.array(nextBestActionSchema),
  evaluatedAt: z.string().datetime(),
});
export type CareerReadinessReport = z.infer<typeof careerReadinessReportSchema>;
