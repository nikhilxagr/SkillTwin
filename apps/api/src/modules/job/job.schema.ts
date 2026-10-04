import { z } from "zod";
import { skillCategorySchema, skillProficiencySchema } from "@skilltwin/contracts";

export const aiJobSkillSchema = z.object({
  name: z.string().min(1),
  importance: z.enum(["Required", "Preferred"]),
  minimumProficiency: skillProficiencySchema.default("Intermediate"),
  contextSentence: z.string().optional(),
});
export type AIJobSkill = z.infer<typeof aiJobSkillSchema>;

export const aiJobExtractionSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
  experience: z.object({
    minYears: z.number().nonnegative().optional(),
    maxYears: z.number().nonnegative().optional(),
    level: z.enum(["Entry", "Mid", "Senior", "Lead", "NotSpecified"]).default("NotSpecified"),
    description: z.string().optional(),
  }),
  education: z.string().optional(),
  requiredSkills: z.array(aiJobSkillSchema).default([]),
  preferredSkills: z.array(aiJobSkillSchema).default([]),
  categorizedSkills: z.object({
    programmingLanguages: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    libraries: z.array(z.string()).default([]),
    databases: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    cloudDevOps: z.array(z.string()).default([]),
    cybersecurity: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([]),
  }),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});
export type AIJobExtraction = z.infer<typeof aiJobExtractionSchema>;
