import { z } from "zod";

export const aiSkillCategorizedSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  libraries: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  cloudDevOps: z.array(z.string()).default([]),
  cybersecurity: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  otherTechnical: z.array(z.string()).default([]),
});
export type AISkillCategorized = z.infer<typeof aiSkillCategorizedSchema>;

export const aiProjectSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
});
export type AIProject = z.infer<typeof aiProjectSchema>;

export const aiExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});
export type AIExperience = z.infer<typeof aiExperienceSchema>;

export const aiEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});
export type AIEducation = z.infer<typeof aiEducationSchema>;

export const aiCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  year: z.string().optional(),
});
export type AICertification = z.infer<typeof aiCertificationSchema>;

export const aiResumeExtractionSchema = z.object({
  profile: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    githubUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
    summary: z.string().optional(),
    yearsOfExperienceEstimate: z.number().nonnegative().optional(),
  }),
  categorizedSkills: aiSkillCategorizedSchema,
  projects: z.array(aiProjectSchema).default([]),
  experience: z.array(aiExperienceSchema).default([]),
  education: z.array(aiEducationSchema).default([]),
  certifications: z.array(aiCertificationSchema).default([]),
  achievements: z.array(z.string()).default([]),
});
export type AIResumeExtraction = z.infer<typeof aiResumeExtractionSchema>;
