import { z } from "zod";

export const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

export const publicSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(usernameRegex, "Username can only contain alphanumeric characters, underscores, and hyphens")
    .optional(),
  isPublic: z.boolean().default(true),
  allowRecruiterJdMatch: z.boolean().default(true),
  showGithubEvidence: z.boolean().default(true),
  showSkillMatrix: z.boolean().default(true),
  showProjects: z.boolean().default(true),
  contactEmailVisible: z.boolean().default(false),
  customPitch: z.string().max(1000).optional().default(""),
  linkedinUrl: z.string().max(255).optional().default(""),
  githubUrl: z.string().max(255).optional().default(""),
  portfolioUrl: z.string().max(255).optional().default(""),
});

export type UserPublicSettings = z.infer<typeof publicSettingsSchema>;

export const claimUsernameRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(usernameRegex, "Username can only contain alphanumeric characters, underscores, and hyphens"),
});

export type ClaimUsernameRequest = z.infer<typeof claimUsernameRequestSchema>;

export const updatePublicSettingsRequestSchema = publicSettingsSchema.partial();
export type UpdatePublicSettingsRequest = z.infer<typeof updatePublicSettingsRequestSchema>;

export const checkUsernameResponseSchema = z.object({
  available: z.boolean(),
  username: z.string(),
  message: z.string(),
});

export type CheckUsernameResponse = z.infer<typeof checkUsernameResponseSchema>;

export const publicVerifiedSkillSchema = z.object({
  name: z.string(),
  category: z.string().default("core"),
  level: z.string().default("intermediate"),
  verifiedByGithub: z.boolean().default(false),
  evidenceRepoName: z.string().optional(),
  evidenceSnippet: z.string().optional(),
});

export type PublicVerifiedSkill = z.infer<typeof publicVerifiedSkillSchema>;

export const publicFeaturedProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  languages: z.array(z.string()).default([]),
  repoUrl: z.string().optional(),
  stars: z.number().optional().default(0),
  architectureHighlights: z.array(z.string()).optional().default([]),
  verifiedMetrics: z
    .object({
      commits: z.number().optional(),
      loc: z.number().optional(),
    })
    .optional(),
});

export type PublicFeaturedProject = z.infer<typeof publicFeaturedProjectSchema>;

export const publicTwinProfileSchema = z.object({
  username: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional().default(""),
  headline: z.string().default(""),
  targetRole: z.string().default("Software Engineer"),
  bio: z.string().default(""),
  joinedAt: z.string(),
  customPitch: z.string().optional().default(""),
  socials: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    portfolio: z.string().optional(),
    contactEmail: z.string().optional(),
  }),
  verifiedBadges: z.object({
    emailVerified: z.boolean().default(false),
    githubConnected: z.boolean().default(false),
    githubUsername: z.string().optional(),
    totalRepositoriesAnalyzed: z.number().default(0),
    totalLinesOfCode: z.number().optional().default(0),
    verifiedSkillsCount: z.number().default(0),
  }),
  skills: z.array(publicVerifiedSkillSchema).default([]),
  featuredProjects: z.array(publicFeaturedProjectSchema).default([]),
  stats: z.object({
    topLanguages: z.array(
      z.object({
        language: z.string(),
        percentage: z.number(),
      })
    ).default([]),
    readinessScore: z.number().optional(),
  }),
});

export type PublicTwinProfile = z.infer<typeof publicTwinProfileSchema>;

export const recruiterMatchRequestSchema = z.object({
  jobDescriptionText: z.string().trim().min(10, "Please provide at least a brief job description (10+ characters)"),
  roleTitle: z.string().trim().max(100).optional(),
});

export type RecruiterMatchRequest = z.infer<typeof recruiterMatchRequestSchema>;

export const recruiterMatchResponseSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  matchingSkills: z.array(
    z.object({
      skill: z.string(),
      category: z.string(),
      verifiedEvidence: z.string().optional(),
    })
  ),
  missingSkills: z.array(z.string()),
  summary: z.string(),
  strengths: z.array(z.string()),
  matchLevel: z.enum(["High", "Strong", "Moderate", "Developing"]),
});

export type RecruiterMatchResponse = z.infer<typeof recruiterMatchResponseSchema>;
