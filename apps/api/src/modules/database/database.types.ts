import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  JobAnalysis,
  GapAnalysisReport,
  ResumeOptimizationReport,
} from "@skilltwin/contracts";

export type OAuthProviderType = "google" | "github" | "linkedin";

export interface OAuthIdentityDoc {
  provider: OAuthProviderType;
  providerId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: Date;
}

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  verificationTokenHash: string | null;
  verificationTokenExpiresAt: Date | null;
  verificationOtpHash?: string | null;
  verificationOtpExpiresAt?: Date | null;
  resetPasswordTokenHash: string | null;
  resetPasswordTokenExpiresAt: Date | null;
  avatarUrl: string;
  profile: {
    headline: string;
    targetRole: string;
    bio: string;
  };
  providers?: OAuthIdentityDoc[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface ResumeDoc {
  _id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  extractedText: string;
  analysis?: any;
  resumeData: ResumeExtraction;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillProfileDoc {
  _id: string;
  userId: string;
  resumeId: string;
  skills: string[];
  matrix: SkillMatrix;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobAnalysisDoc {
  _id: string;
  userId: string;
  company: string;
  role: string;
  requirements: any;
  jobData: JobExtraction;
  analysis: JobAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface GapAnalysisDoc {
  _id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  results: GapAnalysisReport;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeOptimizationDoc {
  _id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  recommendations: ResumeOptimizationReport;
  createdAt: Date;
  updatedAt: Date;
}
