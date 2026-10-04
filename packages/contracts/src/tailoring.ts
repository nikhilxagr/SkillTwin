import { z } from "zod";
import { optimizationHighlightTagSchema } from "./optimization.js";

/**
 * Alignment Summary showing why the tailored version is better aligned
 * with the target job description than the master resume.
 */
export const alignmentSummarySchema = z.object({
  headline: z.string(),
  matchScoreOriginal: z.number().min(0).max(100),
  matchScoreTailored: z.number().min(0).max(100),
  skillsPrioritizedCount: z.number().int().nonnegative(),
  projectsPrioritizedCount: z.number().int().nonnegative(),
  bulletsImprovedCount: z.number().int().nonnegative(),
  irrelevantItemsDeemphasizedCount: z.number().int().nonnegative(),
  missingEvidenceCount: z.number().int().nonnegative(),
  keyStrategicReasons: z.array(z.string()).default([]),
  detailedRationale: z.string(),
});
export type AlignmentSummary = z.infer<typeof alignmentSummarySchema>;

/**
 * Tailored Skill Item with relevance status and job alignment tagging
 */
export const tailoredSkillItemSchema = z.object({
  id: z.string(),
  skill: z.string(),
  category: z.string(),
  status: z.enum(["core_priority", "secondary", "de_emphasized"]),
  relevanceScore: z.number(),
  reason: z.string(),
  inMaster: z.boolean(),
  inJobRequired: z.boolean(),
  inJobPreferred: z.boolean(),
  highlightTag: optimizationHighlightTagSchema,
  decision: z.enum(["accepted", "rejected", "custom_edited"]).default("accepted"),
  customSkillName: z.string().optional(),
});
export type TailoredSkillItem = z.infer<typeof tailoredSkillItemSchema>;

/**
 * Tailored Project Item with prioritized order, enhanced truthful descriptions, and editable fields
 */
export const tailoredProjectItemSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  originalRank: z.number(),
  tailoredRank: z.number(),
  status: z.enum(["prioritized", "retained", "de_emphasized"]),
  relevanceScore: z.number(),
  reason: z.string(),
  originalDescription: z.string(),
  tailoredDescription: z.string(),
  customDescription: z.string().optional(),
  originalBullets: z.array(z.string()).default([]),
  tailoredBullets: z.array(z.string()).default([]),
  customBullets: z.array(z.string()).optional(),
  targetedJobSkills: z.array(z.string()).default([]),
  truthCheckNote: z.string(),
  highlightTag: optimizationHighlightTagSchema,
  decision: z.enum(["accepted", "rejected", "custom_edited"]).default("accepted"),
});
export type TailoredProjectItem = z.infer<typeof tailoredProjectItemSchema>;

/**
 * Tailored Bullet Item with truthful enhancement, reason, and editable content
 */
export const tailoredBulletItemSchema = z.object({
  id: z.string(),
  experienceRole: z.string(),
  experienceCompany: z.string(),
  originalBullet: z.string(),
  tailoredBullet: z.string(),
  customBullet: z.string().optional(),
  status: z.enum(["improved", "retained", "de_emphasized"]),
  reason: z.string(),
  targetedRequirement: z.string(),
  truthCheckNote: z.string(),
  highlightTag: optimizationHighlightTagSchema,
  decision: z.enum(["accepted", "rejected", "custom_edited"]).default("accepted"),
});
export type TailoredBulletItem = z.infer<typeof tailoredBulletItemSchema>;

/**
 * De-emphasized or Removed Content to eliminate noise and optimize recruiter scanning
 */
export const deemphasizedContentItemSchema = z.object({
  id: z.string(),
  section: z.string(),
  originalText: z.string(),
  reason: z.string(),
  suggestedAction: z.enum(["remove", "condense", "move_to_appendix"]),
  decision: z.enum(["accepted", "rejected"]).default("accepted"),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
});
export type DeemphasizedContentItem = z.infer<typeof deemphasizedContentItemSchema>;

/**
 * Missing Evidence Notice for transparent, zero-fabrication gap notification
 */
export const missingEvidenceNoticeSchema = z.object({
  id: z.string(),
  jobRequirement: z.string(),
  importance: z.enum(["Required", "Preferred"]),
  evidenceState: z.enum(["MISSING", "WEAK_EVIDENCE"]),
  truthfulGuidance: z.string(),
  highlightTag: optimizationHighlightTagSchema.default("MISSING"),
});
export type MissingEvidenceNotice = z.infer<typeof missingEvidenceNoticeSchema>;

/**
 * Complete Job-Specific Tailored Resume Package
 */
export const jobSpecificTailoredResumeSchema = z.object({
  id: z.string(),
  masterResumeId: z.string(),
  selectedJobId: z.string(),
  targetRole: z.string(),
  company: z.string().optional(),
  alignmentSummary: alignmentSummarySchema,
  prioritizedSkills: z.array(tailoredSkillItemSchema).default([]),
  prioritizedProjects: z.array(tailoredProjectItemSchema).default([]),
  tailoredBullets: z.array(tailoredBulletItemSchema).default([]),
  deemphasizedContent: z.array(deemphasizedContentItemSchema).default([]),
  missingEvidenceNotices: z.array(missingEvidenceNoticeSchema).default([]),
  tailoredSummary: z.string(),
  customSummary: z.string().optional(),
  truthfulGuarantees: z.array(z.string()).default([]),
  generatedAt: z.string().datetime(),
});
export type JobSpecificTailoredResume = z.infer<typeof jobSpecificTailoredResumeSchema>;
