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

export const developerTwinSchema = z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    initials: z.string(),
    yearsOfEvidence: z.number().nonnegative(),
  }),
  summary: z.object({
    evidenceConfidence: z.number().min(0).max(100),
    connectedSources: z.number().int().nonnegative(),
    projectsAnalyzed: z.number().int().nonnegative(),
    lastAnalyzed: z.string(),
  }),
  skills: z.array(
    skillAssessmentSchema.extend({
      evidenceSummary: z.string(),
      domain: z.string(),
      subSkills: z.array(z.string()),
    }),
  ),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    skill: z.string(),
  }),
});

export type DeveloperTwin = z.infer<typeof developerTwinSchema>;

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
export const gapResultSchema = z.object({
  skill: z.string(),
  currentEstimate: z.number().min(0).max(100),
  targetEstimate: z.number().min(0).max(100),
  status: z.enum(["strong", "developing", "gap", "missing_evidence"]),
  rationale: z.string(),
  importance: z.enum(["required", "important", "useful"]),
});
export const gapAnalysisSchema = z.object({
  role: roleProfileSchema,
  results: z.array(gapResultSchema),
  disclaimer: z.string(),
});
export type RoleProfile = z.infer<typeof roleProfileSchema>;
export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

export const roadmapItemSchema = z.object({
  week: z.number().int().positive(),
  skill: z.string(),
  objective: z.string(),
  tasks: z.array(z.string()),
  expectedEvidence: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
});
export const roadmapSchema = z.object({
  role: roleProfileSchema,
  items: z.array(roadmapItemSchema),
  disclaimer: z.string(),
});
export type Roadmap = z.infer<typeof roadmapSchema>;

export const interviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  focusSkill: z.string(),
  projectContext: z.string(),
  whyThisQuestion: z.string(),
});
export const interviewEvaluationSchema = z.object({
  technicalUnderstanding: z.number().min(0).max(5),
  accuracy: z.number().min(0).max(5),
  depth: z.number().min(0).max(5),
  communication: z.number().min(0).max(5),
  feedback: z.string(),
  followUp: z.string(),
  evidenceNote: z.string(),
});
export const interviewSessionSchema = z.object({
  id: z.string(),
  role: roleProfileSchema,
  questions: z.array(interviewQuestionSchema),
  disclaimer: z.string(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;

export const evolutionChangeSchema = z.object({
  skill: z.string(),
  previousEstimate: z.number().min(0).max(100),
  currentEstimate: z.number().min(0).max(100),
  evidenceChange: z.string(),
  interpretation: z.string(),
});
export const evolutionSnapshotSchema = z.object({
  id: z.string(),
  analyzedAt: z.string(),
  label: z.string(),
  evidenceConfidence: z.number().min(0).max(100),
  skillsTracked: z.number().int().nonnegative(),
});
export const evolutionSchema = z.object({
  snapshots: z.array(evolutionSnapshotSchema),
  changes: z.array(evolutionChangeSchema),
  newEvidence: z.array(z.string()),
  remainingGaps: z.array(z.string()),
  disclaimer: z.string(),
});
export type Evolution = z.infer<typeof evolutionSchema>;

export const resumeEvidenceSchema = z.object({
  id: z.string(),
  sourceType: z.literal("resume"),
  statement: z.string(),
  category: z.enum(["skill", "experience", "education", "project", "link"]),
  confidence: z.enum(["low", "moderate", "high"]),
});
export const resumeUploadSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  status: z.enum(["parsed", "partial", "failed"]),
  extractedTextLength: z.number().int().nonnegative(),
  evidence: z.array(resumeEvidenceSchema),
  limitations: z.array(z.string()),
});
export type ResumeUpload = z.infer<typeof resumeUploadSchema>;

export const githubRepositoryEvidenceSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  languages: z.array(z.string()),
  topics: z.array(z.string()),
  signals: z.object({
    readme: z.enum(["missing", "basic", "documented"]),
    testing: z.enum(["not_detected", "partial", "present"]),
    documentation: z.enum(["not_detected", "partial", "present"]),
    activity: z.enum(["low", "steady", "active"]),
  }),
  evidenceSummary: z.string(),
});
export const githubStatusSchema = z.object({
  mode: z.enum(["demo", "oauth"]),
  connected: z.boolean(),
  username: z.string().nullable(),
  scopes: z.array(z.string()),
  message: z.string(),
});
export const githubSyncSchema = z.object({
  status: z.enum(["completed", "partial", "failed"]),
  repositoriesAnalyzed: z.number().int().nonnegative(),
  evidence: z.array(githubRepositoryEvidenceSchema),
  limitations: z.array(z.string()),
});
export type GithubStatus = z.infer<typeof githubStatusSchema>;
export type GithubSync = z.infer<typeof githubSyncSchema>;

export const analysisResultSchema = z.object({
  id: z.string(),
  provider: z.enum(["deterministic-demo", "external-ai"]),
  status: z.enum(["completed", "partial"]),
  assessments: z.array(skillAssessmentSchema),
  evidenceCount: z.number().int().nonnegative(),
  limitations: z.array(z.string()),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
