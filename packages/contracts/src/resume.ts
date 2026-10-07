import { z } from "zod";

export const resumeProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  summary: z.string().optional(),
  yearsOfExperienceEstimate: z.number().nonnegative().optional(),
});
export type ResumeProfile = z.infer<typeof resumeProfileSchema>;

export const resumeProjectSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
});
export type ResumeProject = z.infer<typeof resumeProjectSchema>;

export const resumeExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;

export const resumeEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});
export type ResumeEducation = z.infer<typeof resumeEducationSchema>;

export const resumeCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  year: z.string().optional(),
});
export type ResumeCertification = z.infer<typeof resumeCertificationSchema>;

export const resumeExtractionSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.enum(["pdf", "docx", "txt"]),
  fileSizeBytes: z.number().nonnegative(),
  rawText: z.string().min(1),
  profile: resumeProfileSchema,
  skillsClaimed: z.array(z.string()).default([]),
  projects: z.array(resumeProjectSchema).default([]),
  experience: z.array(resumeExperienceSchema).default([]),
  education: z.array(resumeEducationSchema).default([]),
  certifications: z.array(resumeCertificationSchema).default([]),
  achievements: z.array(z.string()).default([]),
  parsedAt: z.string().datetime(),
});
export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;

export const resumeEvidenceSchema = z.object({
  id: z.string(),
  sourceType: z.literal("resume"),
  statement: z.string(),
  category: z.enum(["skill", "experience", "education", "project", "link"]),
  confidence: z.enum(["low", "moderate", "high"]),
});
export type ResumeEvidence = z.infer<typeof resumeEvidenceSchema>;

export const resumeUploadSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  status: z.enum(["parsed", "partial", "failed"]),
  extractedTextLength: z.number().int().nonnegative(),
  evidence: z.array(resumeEvidenceSchema),
  limitations: z.array(z.string()),
});
export type ResumeUpload = z.infer<typeof resumeUploadSchema>;
