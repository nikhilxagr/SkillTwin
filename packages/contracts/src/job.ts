import { z } from "zod";
import { skillCategorySchema, skillProficiencySchema } from "./skills.js";

export const jobImportanceSchema = z.enum(["Required", "Preferred"]);
export type JobImportance = z.infer<typeof jobImportanceSchema>;

export const jobSkillRequirementSchema = z.object({
  canonicalName: z.string().min(1),
  category: skillCategorySchema,
  importance: jobImportanceSchema,
  minimumProficiency: skillProficiencySchema.default("Intermediate"),
  contextSentence: z.string().optional(),
});
export type JobSkillRequirement = z.infer<typeof jobSkillRequirementSchema>;

export const jobExperienceRequirementSchema = z.object({
  minYears: z.number().nonnegative().optional(),
  maxYears: z.number().nonnegative().optional(),
  level: z.enum(["Entry", "Junior", "Mid", "Senior", "Lead", "Principal", "NotSpecified"]).default("NotSpecified"),
  description: z.string().optional(),
});
export type JobExperienceRequirement = z.infer<typeof jobExperienceRequirementSchema>;

export const jobKeywordsSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  libraries: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  cloud: z.array(z.string()).optional(),
  devops: z.array(z.string()).optional(),
  cloudDevOps: z.array(z.string()).default([]),
  testing: z.array(z.string()).optional(),
  security: z.array(z.string()).optional(),
  cybersecurity: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  generalKeywords: z.array(z.string()).default([]),
  technicalSkills: z.array(z.string()).default([]),
});
export type JobKeywords = z.infer<typeof jobKeywordsSchema>;

export const jobExtractionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
  rawText: z.string().min(1),
  experience: jobExperienceRequirementSchema,
  education: z.string().optional(),
  requiredSkills: z.array(jobSkillRequirementSchema).default([]),
  preferredSkills: z.array(jobSkillRequirementSchema).default([]),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  keywords: jobKeywordsSchema,
  parsedAt: z.string().datetime(),
});
export type JobExtraction = z.infer<typeof jobExtractionSchema>;

export const jobAnalysisSchema = z.object({
  id: z.string().min(1),
  job: jobExtractionSchema,
  summary: z.object({
    roleTitle: z.string(),
    company: z.string().optional(),
    totalRequiredSkills: z.number().int().nonnegative(),
    totalPreferredSkills: z.number().int().nonnegative(),
    experienceLevel: z.string(),
    minYearsExperience: z.number().nonnegative().optional(),
    topCategories: z.array(skillCategorySchema).default([]),
  }),
  analyzedAt: z.string().datetime(),
});
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

// Backward compatibility schemas
export const roleSkillSchema = z.object({
  skill: z.string(),
  targetEstimate: z.number().min(0).max(100),
  importance: z.enum(["required", "important", "useful"]),
});
export const roleProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  skills: z.array(roleSkillSchema),
});
export type RoleProfile = z.infer<typeof roleProfileSchema>;
