import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("skilltwin-api"),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

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
