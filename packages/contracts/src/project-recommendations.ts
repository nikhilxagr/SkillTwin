import { z } from "zod";
import { skillCategorySchema, skillProficiencySchema } from "./skills.js";

/**
 * Phase 10: Project Recommendation Engine Contracts
 *
 * Grounded in Target Job + Skill Matrix + Gap Analysis.
 * Generates production-grade projects specifically targeting the candidate's
 * missing skills and weak evidence, avoiding generic tutorial projects.
 */

export const projectDifficultySchema = z.enum([
  "Intermediate",
  "Advanced",
  "Production-Grade",
]);
export type ProjectDifficulty = z.infer<typeof projectDifficultySchema>;

export const projectArchitectureComponentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  technologies: z.array(z.string()).min(1),
});
export type ProjectArchitectureComponent = z.infer<typeof projectArchitectureComponentSchema>;

export const projectArchitectureSchema = z.object({
  pattern: z.string().min(1),
  overview: z.string().min(1),
  components: z.array(projectArchitectureComponentSchema).min(1),
  dataFlow: z.array(z.string()).min(1),
  storageAndCaching: z.string().min(1),
  containerizationAndDeployment: z.string().min(1),
});
export type ProjectArchitecture = z.infer<typeof projectArchitectureSchema>;

export const projectMilestoneSchema = z.object({
  milestoneNumber: z.number().int().positive(),
  title: z.string().min(1),
  duration: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  deliverables: z.array(z.string()).min(1),
  evidenceTarget: z.string().min(1),
});
export type ProjectMilestone = z.infer<typeof projectMilestoneSchema>;

export const projectEvidenceCategorySchema = z.enum([
  "Code & Architecture",
  "Testing & Verification",
  "Infrastructure & DevOps",
  "Benchmarking & Observability",
]);
export type ProjectEvidenceCategory = z.infer<typeof projectEvidenceCategorySchema>;

export const projectEvidenceItemSchema = z.object({
  category: projectEvidenceCategorySchema,
  artifact: z.string().min(1),
  verificationMethod: z.string().min(1),
  targetMetric: z.string().optional(),
});
export type ProjectEvidenceItem = z.infer<typeof projectEvidenceItemSchema>;

export const stackCategoryItemSchema = z.object({
  category: z.string().min(1),
  technologies: z.array(z.string()).min(1),
});
export type StackCategoryItem = z.infer<typeof stackCategoryItemSchema>;

export const recommendedProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  whyRelevant: z.string().min(1),
  targetedGaps: z.array(z.string()).min(1),
  skillsDemonstrated: z.array(z.string()).min(1),
  difficulty: projectDifficultySchema,
  estimatedDuration: z.string().min(1),
  suggestedStack: z.array(stackCategoryItemSchema).min(1),
  features: z.array(z.string()).min(1),
  architecture: projectArchitectureSchema,
  milestones: z.array(projectMilestoneSchema).min(1),
  expectedEvidence: z.array(projectEvidenceItemSchema).min(1),
});
export type RecommendedProject = z.infer<typeof recommendedProjectSchema>;

export const codeTemplateSchema = z.object({
  filename: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
});
export type CodeTemplate = z.infer<typeof codeTemplateSchema>;

export const apiEndpointSpecSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().min(1),
  description: z.string().min(1),
  authRequired: z.boolean(),
});
export type ApiEndpointSpec = z.infer<typeof apiEndpointSpecSchema>;

export const databaseTableSpecSchema = z.object({
  tableName: z.string().min(1),
  purpose: z.string().min(1),
  keyFields: z.array(z.string()).min(1),
  indexes: z.array(z.string()),
});
export type DatabaseTableSpec = z.infer<typeof databaseTableSpecSchema>;

export const verificationChecklistItemSchema = z.object({
  task: z.string().min(1),
  proofArtifact: z.string().min(1),
  verificationCommand: z.string().min(1),
});
export type VerificationChecklistItem = z.infer<typeof verificationChecklistItemSchema>;

export const projectBlueprintSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  projectTitle: z.string().min(1),
  generatedAt: z.string().datetime(),
  summary: z.string().min(1),
  systemTopology: z.string().min(1),
  apiEndpoints: z.array(apiEndpointSpecSchema).min(1),
  databaseSchemaDraft: z.array(databaseTableSpecSchema).min(1),
  securityPractices: z.array(z.string()).min(1),
  codeTemplates: z.array(codeTemplateSchema).min(1),
  verificationChecklist: z.array(verificationChecklistItemSchema).min(1),
  resumeBulletPoints: z.array(z.string()).min(1),
});
export type ProjectBlueprint = z.infer<typeof projectBlueprintSchema>;

export const projectRecommendationReportSchema = z.object({
  id: z.string().min(1),
  targetRole: z.string().min(1),
  targetCompany: z.string().optional(),
  generatedAt: z.string().datetime(),
  analyzedGapsCount: z.number().int().nonnegative(),
  targetedGapSkills: z.array(z.string()),
  existingStrongSkills: z.array(z.string()),
  projects: z.array(recommendedProjectSchema).min(1),
});
export type ProjectRecommendationReport = z.infer<typeof projectRecommendationReportSchema>;

export const generateBlueprintRequestSchema = z.object({
  projectId: z.string().min(1),
});
export type GenerateBlueprintRequest = z.infer<typeof generateBlueprintRequestSchema>;
