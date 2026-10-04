import { z } from "zod";

export const optimizationHighlightTagSchema = z.enum([
  "MATCHED",
  "MISSING",
  "WEAK_EVIDENCE",
  "RELEVANT",
  "RECOMMENDED",
]);
export type OptimizationHighlightTag = z.infer<typeof optimizationHighlightTagSchema>;

export const bulletImprovementSchema = z.object({
  id: z.string().min(1),
  originalBullet: z.string().min(1),
  improvedBullet: z.string().min(1),
  targetedSkill: z.string().min(1),
  rationale: z.string().min(1),
  evidenceConfirmed: z.boolean(),
  truthWarning: z.string().optional(),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  sourceSection: z.string().optional(),
});
export type BulletImprovement = z.infer<typeof bulletImprovementSchema>;

export const poorlyRepresentedSkillSchema = z.object({
  id: z.string().min(1),
  skill: z.string().min(1),
  category: z.string(),
  highlightTag: z.literal("WEAK_EVIDENCE").default("WEAK_EVIDENCE"),
  currentResumeContext: z.string().min(1),
  whyPoorlyRepresented: z.string().min(1),
  recommendation: z.string().min(1),
  evidenceRequiredNote: z.string().min(1),
});
export type PoorlyRepresentedSkill = z.infer<typeof poorlyRepresentedSkillSchema>;

export const projectImprovementSchema = z.object({
  id: z.string().min(1),
  projectName: z.string().min(1),
  currentSummary: z.string().min(1),
  targetedSkills: z.array(z.string()).default([]),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  suggestedEnhancement: z.string().min(1),
  truthCheckNote: z.string().min(1),
  evidenceRequiredNote: z.string().min(1),
});
export type ProjectImprovement = z.infer<typeof projectImprovementSchema>;

export const resumeSectionRecommendationSchema = z.object({
  id: z.string().min(1),
  sectionName: z.enum([
    "Professional Summary",
    "Skills Section",
    "Work Experience",
    "Projects",
    "Education & Certifications",
    "Section Ordering",
  ]),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  currentEvaluation: z.string().min(1),
  recommendedChange: z.string().min(1),
  truthCheckNote: z.string().min(1),
});
export type ResumeSectionRecommendation = z.infer<typeof resumeSectionRecommendationSchema>;

export const sectionOrderingRecommendationSchema = z.object({
  id: z.string().default("sec-order-1"),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  currentOrder: z.array(z.string()).default([]),
  recommendedOrder: z.array(z.string()),
  reason: z.string(),
  rationale: z.string(),
  truthCheckNote: z.string(),
});
export type SectionOrderingRecommendation = z.infer<typeof sectionOrderingRecommendationSchema>;

export const skillsSectionCategorySchema = z.object({
  categoryName: z.string().min(1),
  verifiedSkills: z.array(z.string()).default([]),
  developingSkills: z.array(z.string()).default([]),
});
export type SkillsSectionCategory = z.infer<typeof skillsSectionCategorySchema>;

export const skillsSectionRecommendationSchema = z.object({
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  layoutStyle: z.string().min(1),
  categories: z.array(skillsSectionCategorySchema).default([]),
  formattingAdvice: z.string().min(1),
  antiFabricationRule: z.string().min(1),
});
export type SkillsSectionRecommendation = z.infer<typeof skillsSectionRecommendationSchema>;

export const jdAlignmentRecommendationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  targetJobExpectation: z.string().min(1),
  alignmentSuggestion: z.string().min(1),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
  truthCheckNote: z.string().min(1),
});
export type JdAlignmentRecommendation = z.infer<typeof jdAlignmentRecommendationSchema>;

export const truthfulRecommendationSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "demonstrated_skills",
    "missing_jd_skills",
    "project_strengthening",
    "learning_priorities",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  truthCheckNote: z.string().min(1),
  suggestedAction: z.string().min(1),
  highlightTag: optimizationHighlightTagSchema.default("RELEVANT"),
});
export type TruthfulRecommendation = z.infer<typeof truthfulRecommendationSchema>;

export const keywordCoverageItemSchema = z.object({
  keyword: z.string().min(1),
  category: z.string(),
  status: z.enum(["matched", "partial", "missing", "weak_evidence"]),
  highlightTag: optimizationHighlightTagSchema.default("MATCHED"),
  importance: z.enum(["Required", "Preferred"]).default("Required"),
  evidenceSnippet: z.string().optional(),
  synonymMatchedWith: z.string().optional(),
  evidenceRequiredNote: z.string().optional(),
});
export type KeywordCoverageItem = z.infer<typeof keywordCoverageItemSchema>;

export const originalResumeSummarySchema = z.object({
  candidateName: z.string().optional(),
  sectionsPresent: z.array(z.string()).default([]),
  bulletCount: z.number().int().nonnegative().default(0),
  skillsMentionedCount: z.number().int().nonnegative().default(0),
  rawExcerpt: z.string().optional(),
});
export type OriginalResumeSummary = z.infer<typeof originalResumeSummarySchema>;

export const resumeOptimizationReportSchema = z.object({
  id: z.string().min(1),
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  targetRole: z.string().optional(),
  company: z.string().optional(),
  originalResumeSummary: originalResumeSummarySchema.optional(),
  bulletImprovements: z.array(bulletImprovementSchema).default([]),
  poorlyRepresentedSkills: z.array(poorlyRepresentedSkillSchema).default([]),
  projectImprovements: z.array(projectImprovementSchema).default([]),
  sectionRecommendations: z.array(resumeSectionRecommendationSchema).default([]),
  sectionOrdering: sectionOrderingRecommendationSchema.optional(),
  skillsSectionRecommendation: skillsSectionRecommendationSchema.optional(),
  jdAlignmentRecommendations: z.array(jdAlignmentRecommendationSchema).default([]),
  truthfulRecommendations: z.array(truthfulRecommendationSchema).default([]),
  keywordCoverage: z.array(keywordCoverageItemSchema).default([]),
  truthfulGuidanceRules: z.array(z.string()).default([]),
  generatedAt: z.string().datetime(),
});
export type ResumeOptimizationReport = z.infer<typeof resumeOptimizationReportSchema>;

