import { z } from "zod";

export const geminiSkillEvidenceSchema = z.object({
  canonicalName: z.string().min(1),
  category: z.string().min(1),
  confidence: z.number().min(0).max(1), // e.g. 0.84
  proficiency: z.enum(["Strong", "Intermediate", "Basic", "Not Demonstrated"]).default("Basic"),
  evidence: z.array(z.string()).default([]),
  source: z.string().default("Resume Extraction"),
  missingEvidence: z.array(z.string()).default([]),
});
export type GeminiSkillEvidence = z.infer<typeof geminiSkillEvidenceSchema>;

export const geminiCategorizedSkillsSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  libraries: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  cloudTechnologies: z.array(z.string()).default([]),
  devopsTechnologies: z.array(z.string()).default([]),
  cybersecurityTechnologies: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  otherTechnical: z.array(z.string()).default([]),
});
export type GeminiCategorizedSkills = z.infer<typeof geminiCategorizedSkillsSchema>;

export const geminiProjectSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  technologies: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  githubUrl: z.string().optional().nullable(),
  liveUrl: z.string().optional().nullable(),
});
export type GeminiProject = z.infer<typeof geminiProjectSchema>;

export const geminiExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});
export type GeminiExperience = z.infer<typeof geminiExperienceSchema>;

export const geminiEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  gpa: z.string().optional().nullable(),
});
export type GeminiEducation = z.infer<typeof geminiEducationSchema>;

export const geminiCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
});
export type GeminiCertification = z.infer<typeof geminiCertificationSchema>;

export const geminiProfileSchema = z.object({
  name: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  portfolioUrl: z.string().optional().nullable(),
  yearsOfExperienceEstimate: z.number().nonnegative().optional().nullable(),
});
export type GeminiProfile = z.infer<typeof geminiProfileSchema>;

export const geminiResumeAnalysisSchema = z.object({
  profile: geminiProfileSchema,
  categorizedSkills: geminiCategorizedSkillsSchema,
  skillEvidence: z.array(geminiSkillEvidenceSchema).default([]),
  projects: z.array(geminiProjectSchema).default([]),
  experience: z.array(geminiExperienceSchema).default([]),
  education: z.array(geminiEducationSchema).default([]),
  certifications: z.array(geminiCertificationSchema).default([]),
  achievements: z.array(z.string()).default([]),
});
export type GeminiResumeAnalysis = z.infer<typeof geminiResumeAnalysisSchema>;
