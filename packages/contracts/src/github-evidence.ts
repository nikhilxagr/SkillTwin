import { z } from "zod";
import { skillCategorySchema } from "./skills.js";

/**
 * Phase 11: GitHub Integration & Evidence Verification Contracts
 *
 * Grounded in authorized GitHub API access (no scraping).
 * Cross-references code repository evidence against Resume claims
 * with respectful, non-accusatory discrepancy reporting.
 */

export const repositoryLanguageSchema = z.object({
  name: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});
export type RepositoryLanguage = z.infer<typeof repositoryLanguageSchema>;

export const dependencyCategorySchema = z.enum([
  "framework",
  "database",
  "testing",
  "tool",
  "cloud",
  "utility",
]);
export type DependencyCategory = z.infer<typeof dependencyCategorySchema>;

export const repositoryDependencySchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  category: dependencyCategorySchema,
});
export type RepositoryDependency = z.infer<typeof repositoryDependencySchema>;

export const repositoryTestingEvidenceSchema = z.object({
  detected: z.boolean(),
  frameworks: z.array(z.string()),
  testFileCount: z.number().int().nonnegative(),
  testDirectories: z.array(z.string()),
});
export type RepositoryTestingEvidence = z.infer<typeof repositoryTestingEvidenceSchema>;

export const repositoryDockerEvidenceSchema = z.object({
  detected: z.boolean(),
  hasDockerfile: z.boolean(),
  hasDockerCompose: z.boolean(),
  files: z.array(z.string()),
});
export type RepositoryDockerEvidence = z.infer<typeof repositoryDockerEvidenceSchema>;

export const repositoryDeploymentEvidenceSchema = z.object({
  detected: z.boolean(),
  platforms: z.array(z.string()),
  configFiles: z.array(z.string()),
});
export type RepositoryDeploymentEvidence = z.infer<typeof repositoryDeploymentEvidenceSchema>;

export const analyzedRepositorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  htmlUrl: z.string().url(),
  description: z.string().nullable(),
  primaryLanguage: z.string().nullable(),
  languages: z.array(repositoryLanguageSchema),
  topics: z.array(z.string()).default([]),
  isFork: z.boolean().default(false),
  defaultBranch: z.string().default("main"),
  starsCount: z.number().int().nonnegative().default(0),
  forksCount: z.number().int().nonnegative().default(0),
  openIssuesCount: z.number().int().nonnegative().default(0),
  updatedAt: z.string(),
  pushedAt: z.string(),
  activityLevel: z.enum(["Active", "Steady", "Dormant"]),
  structure: z.object({
    hasSrc: z.boolean(),
    hasTests: z.boolean(),
    hasDocs: z.boolean(),
    keyDirectories: z.array(z.string()),
  }),
  dependencies: z.array(repositoryDependencySchema).default([]),
  readmeSummary: z.string().optional(),
  testing: repositoryTestingEvidenceSchema,
  docker: repositoryDockerEvidenceSchema,
  deployment: repositoryDeploymentEvidenceSchema,
  detectedTechnologies: z.array(z.string()),
});
export type AnalyzedRepository = z.infer<typeof analyzedRepositorySchema>;

export const evidenceComparisonStatusSchema = z.enum([
  "VERIFIED",
  "PARTIAL_MATCH",
  "DISCREPANCY",
  "GITHUB_ONLY",
]);
export type EvidenceComparisonStatus = z.infer<typeof evidenceComparisonStatusSchema>;

export const projectEvidenceStrengthSchema = z.enum([
  "Strong",
  "Moderate",
  "Weak",
  "None",
]);
export type ProjectEvidenceStrength = z.infer<typeof projectEvidenceStrengthSchema>;

export const evidenceConfidenceSchema = z.enum([
  "High",
  "Moderate",
  "Developing",
  "Low",
]);
export type EvidenceConfidence = z.infer<typeof evidenceConfidenceSchema>;

export const skillEvidenceComparisonSchema = z.object({
  canonicalName: z.string().min(1),
  category: skillCategorySchema,
  resumeEvidence: z.boolean(),
  resumeEvidenceDetail: z.string().min(1),
  githubEvidence: z.boolean(),
  githubEvidenceDetail: z.string().min(1),
  detectedRepoCount: z.number().int().nonnegative(),
  detectedRepos: z.array(z.string()),
  projectEvidence: projectEvidenceStrengthSchema,
  confidence: evidenceConfidenceSchema,
  status: evidenceComparisonStatusSchema,
  discrepancyMessage: z.string().optional(),
  recommendationTip: z.string().optional(),
});
export type SkillEvidenceComparison = z.infer<typeof skillEvidenceComparisonSchema>;

export const githubEvidenceReportSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  connectedAt: z.string().datetime(),
  totalRepositories: z.number().int().nonnegative(),
  analyzedRepositories: z.array(analyzedRepositorySchema),
  comparisons: z.array(skillEvidenceComparisonSchema),
  summary: z.object({
    totalSkillsEvaluated: z.number().int().nonnegative(),
    verifiedCount: z.number().int().nonnegative(),
    discrepancyCount: z.number().int().nonnegative(),
    githubOnlyCount: z.number().int().nonnegative(),
    overallEvidenceStrength: z.enum(["Strong", "Moderate", "Developing"]),
  }),
  discrepancies: z.array(skillEvidenceComparisonSchema),
});
export type GithubEvidenceReport = z.infer<typeof githubEvidenceReportSchema>;

export const githubConnectRequestSchema = z.object({
  token: z.string().optional(),
  username: z.string().min(1),
});
export type GithubConnectRequest = z.infer<typeof githubConnectRequestSchema>;
