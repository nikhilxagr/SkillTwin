import { z } from "zod";

export const standardSkillCategories = [
  "Frontend",
  "Backend",
  "Programming Languages",
  "Languages",
  "Database",
  "Databases",
  "DevOps",
  "Cloud",
  "Cloud/DevOps",
  "Testing",
  "Security",
  "Cybersecurity",
  "Tools",
  "Data",
  "AI/ML",
  "System Design",
  "Soft Skills",
] as const;

export type StandardSkillCategory = (typeof standardSkillCategories)[number];
export type SkillCategory = StandardSkillCategory | string;
export const skillCategorySchema = z.string().min(1);

export const skillProficiencySchema = z.enum([
  "Strong",
  "Intermediate",
  "Beginner",
  "Weak",
]);
export type SkillProficiency = z.infer<typeof skillProficiencySchema>;

export const skillEvidenceLevelSchema = z.enum([
  "Demonstrated",
  "ClaimedOnly",
  "WeakEvidence",
]);
export type SkillEvidenceLevel = z.infer<typeof skillEvidenceLevelSchema>;

export const evidenceSourceTypeSchema = z.enum([
  "skills_section",
  "project",
  "work_experience",
  "education",
  "certification",
  "github",
  "interview",
]);
export type EvidenceSourceType = z.infer<typeof evidenceSourceTypeSchema>;

export const evidenceItemSchema = z.object({
  id: z.string(),
  sourceType: evidenceSourceTypeSchema,
  context: z.string().min(1),
  sourceTitle: z.string().optional(),
  weight: z.number().min(0).max(100),
  verified: z.boolean().default(true),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const skillMatrixItemSchema = z.object({
  canonicalName: z.string().min(1),
  category: skillCategorySchema,
  aliases: z.array(z.string()).default([]),
  proficiency: skillProficiencySchema,
  confidence: z.number().min(0).max(100),
  evidenceLevel: skillEvidenceLevelSchema,
  evidence: z.array(evidenceItemSchema).default([]),
  source: z.string().optional(),
  explanation: z.string().min(1),
  missingEvidence: z.array(z.string()).default([]),
  relatedSkills: z.array(z.string()).default([]),
  claimed: z.boolean(),
  demonstrated: z.boolean(),
});
export type SkillMatrixItem = z.infer<typeof skillMatrixItemSchema>;

export const skillMatrixSummarySchema = z.object({
  totalSkills: z.number().int().nonnegative(),
  demonstratedCount: z.number().int().nonnegative(),
  claimedOnlyCount: z.number().int().nonnegative(),
  weakEvidenceCount: z.number().int().nonnegative(),
  averageConfidence: z.number().min(0).max(100),
  topSkills: z.array(z.string()).default([]),
});
export type SkillMatrixSummary = z.infer<typeof skillMatrixSummarySchema>;

export const skillMatrixSchema = z.object({
  resumeId: z.string().min(1),
  items: z.array(skillMatrixItemSchema),
  summary: skillMatrixSummarySchema,
  generatedAt: z.string().datetime(),
});
export type SkillMatrix = z.infer<typeof skillMatrixSchema>;

// Skill Engine & Normalization Contracts
export const canonicalSkillDefinitionSchema = z.object({
  id: z.string(),
  canonicalName: z.string().min(1),
  category: skillCategorySchema,
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  ecosystemPartners: z.array(z.string()).default([]),
  evidenceExpectations: z.array(z.string()).default([]),
});
export type CanonicalSkillDefinition = z.infer<typeof canonicalSkillDefinitionSchema>;

export const normalizedSkillMatchSchema = z.object({
  canonicalName: z.string(),
  rawInput: z.string(),
  matchedAlias: z.string(),
  category: skillCategorySchema,
  confidence: z.number().min(0).max(100),
  matchType: z.enum(["exact_canonical", "alias", "normalized_stem", "inferred"]),
});
export type NormalizedSkillMatch = z.infer<typeof normalizedSkillMatchSchema>;

export const skillNormalizationResultSchema = z.object({
  matches: z.array(normalizedSkillMatchSchema),
  unmatchedTokens: z.array(z.string()),
});
export type SkillNormalizationResult = z.infer<typeof skillNormalizationResultSchema>;

export const confidenceFactorsSchema = z.object({
  directClaim: z.number().min(0).max(100),
  projectCorroboration: z.number().min(0).max(100),
  commercialExperience: z.number().min(0).max(100),
  ecosystemSynergies: z.number().min(0).max(100),
  recencyBonus: z.number().min(0).max(100),
  totalScore: z.number().min(0).max(100),
});
export type ConfidenceFactors = z.infer<typeof confidenceFactorsSchema>;

// Backward compatibility schemas
export const evidenceSourceSchema = z.enum(["resume", "github", "project", "interview"]);
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

export const skillAssessmentSchema = z.object({
  skill: z.string().min(1),
  confidenceEstimate: z.number().min(0).max(100),
  evidenceSources: z.array(evidenceSourceSchema),
  explanation: z.string().min(1),
});
export type SkillAssessment = z.infer<typeof skillAssessmentSchema>;

export const developerTwinSchema = z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    initials: z.string(),
    yearsOfEvidence: z.number().nonnegative(),
  }),
  summary: z.object({
    evidenceConfidence: z.number().min(0).max(100),
    connectedSources: z.number().int().nonnegative(),
    projectsAnalyzed: z.number().int().nonnegative(),
    lastAnalyzed: z.string(),
  }),
  skills: z.array(
    skillAssessmentSchema.extend({
      evidenceSummary: z.string(),
      domain: z.string(),
      subSkills: z.array(z.string()),
    }),
  ),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    skill: z.string(),
  }),
});
export type DeveloperTwin = z.infer<typeof developerTwinSchema>;
