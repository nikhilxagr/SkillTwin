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
