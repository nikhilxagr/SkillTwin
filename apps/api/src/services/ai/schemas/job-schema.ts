import { z } from "zod";

export const geminiJobSkillRequirementSchema = z.object({
  name: z.string().min(1),
  category: z.string().default("Languages"),
  importance: z.enum(["Required", "Preferred"]),
  minimumProficiency: z.enum(["Strong", "Intermediate", "Beginner", "Weak"]).default("Intermediate"),
  contextSentence: z.string().optional().nullable(),
  whyRequired: z.string().optional().nullable(),
});
export type GeminiJobSkillRequirement = z.infer<typeof geminiJobSkillRequirementSchema>;

export const geminiJobExperienceSchema = z.object({
  minYears: z.number().nonnegative().optional().nullable(),
  maxYears: z.number().nonnegative().optional().nullable(),
  level: z.enum(["Entry", "Junior", "Mid", "Senior", "Lead", "Principal", "NotSpecified"]).default("NotSpecified"),
  description: z.string().optional().nullable(),
});
export type GeminiJobExperience = z.infer<typeof geminiJobExperienceSchema>;

export const geminiJobEducationSchema = z.object({
  degree: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  required: z.boolean().default(false),
  description: z.string().optional().nullable(),
});
export type GeminiJobEducation = z.infer<typeof geminiJobEducationSchema>;

export const geminiJobCategorizedSkillsSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  libraries: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
  devops: z.array(z.string()).default([]),
  testing: z.array(z.string()).default([]),
  security: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
});
export type GeminiJobCategorizedSkills = z.infer<typeof geminiJobCategorizedSkillsSchema>;

export const geminiJobAnalysisSchema = z.object({
  role: z.string().min(1),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  experience: geminiJobExperienceSchema,
  education: geminiJobEducationSchema,
  requiredSkills: z.array(geminiJobSkillRequirementSchema).default([]),
  preferredSkills: z.array(geminiJobSkillRequirementSchema).default([]),
  categorizedSkills: geminiJobCategorizedSkillsSchema,
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});
export type GeminiJobAnalysis = z.infer<typeof geminiJobAnalysisSchema>;
