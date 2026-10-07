import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  JobAnalysis,
  GapAnalysisReport,
  CareerReadinessReport,
  ResumeOptimizationReport,
  GithubEvidenceReport,
  AnalyzedRepository,
  SkillEvidenceComparison,
  SafeUser,
  SignupRequest,
  LoginRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  OAuthProvider,
  LinkedProvider,
} from "@skilltwin/contracts";

function sanitizeUrl(raw: string): string {
  if (!raw) return "";
  const clean = raw.trim().replace(/%20/g, "-").replace(/\s+/g, "-");
  return clean.replace(/\/+$/, "");
}

const defaultApiUrl =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "https://skilltwin-api-hafc.onrender.com"
    : "http://localhost:4000";

const RAW_API_URL = (import.meta as any).env?.VITE_API_URL || defaultApiUrl;
export const API_BASE_URL = sanitizeUrl(String(RAW_API_URL));

export const TOKEN_STORAGE_KEY = "skilltwin_token";

export function getStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  code?: string;
  message: string;
}

export interface ResumePipelineResult {
  resume: ResumeExtraction;
  matrix: SkillMatrix;
}

export class ApiError extends Error {
  constructor(message: string, public readonly code?: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Upload resume file (PDF or TXT) via multipart form-data
 */
export async function uploadResumeFile(file: File): Promise<ResumePipelineResult> {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    credentials: "include",
    body: formData,
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to process resume file.", body.code, response.status);
  }

  return body.data as ResumePipelineResult;
}

/**
 * Submit raw resume text for analysis and matrix generation
 */
export async function uploadResumeText(fileName: string, text: string): Promise<ResumePipelineResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ fileName, text }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to process resume text.", body.code, response.status);
  }

  return body.data as ResumePipelineResult;
}

/**
 * Retrieve a previously analyzed resume
 */
export async function getResume(id: string): Promise<ResumeExtraction> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${id}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Resume not found.", undefined, response.status);
  }

  return body.data as ResumeExtraction;
}

/**
 * Retrieve the latest analyzed resume for authenticated user
 */
export async function getLatestResume(): Promise<ResumeExtraction | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/resumes/latest`, {
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.data || null;
  } catch {
    return null;
  }
}

/**
 * Retrieve the skill matrix for a resume
 */
export async function getResumeMatrix(id: string): Promise<SkillMatrix | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${encodeURIComponent(id)}/matrix`, {
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.data || null;
  } catch {
    return null;
  }
}

export interface JobPipelineResult {
  job: JobExtraction;
  analysis: JobAnalysis;
}

/**
 * Upload job description file (PDF or TXT) via multipart form-data
 */
export async function uploadJobFile(
  file: File,
  fallbackTitle?: string,
  fallbackCompany?: string
): Promise<JobPipelineResult> {
  const formData = new FormData();
  formData.append("job", file);
  if (fallbackTitle) formData.append("title", fallbackTitle);
  if (fallbackCompany) formData.append("company", fallbackCompany);

  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    credentials: "include",
    body: formData,
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to process job description file.", body.code, response.status);
  }

  return body.data as JobPipelineResult;
}

/**
 * Submit raw job description text for requirement extraction and normalization
 */
export async function uploadJobText(
  title: string,
  company: string,
  text: string
): Promise<JobPipelineResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ title, company, text }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to analyze job description.", body.code, response.status);
  }

  return body.data as JobPipelineResult;
}

/**
 * Retrieve a previously analyzed job description
 */
export async function getJob(id: string): Promise<JobExtraction> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Job description not found.", undefined, response.status);
  }

  return body.data as JobExtraction;
}

/**
 * Retrieve the latest analyzed job description for authenticated user
 */
export async function getLatestJob(): Promise<{ job: JobExtraction; analysis: JobAnalysis } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/latest`, {
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.data || null;
  } catch {
    return null;
  }
}

/**
 * Retrieve the analysis summary for a job description
 */
export async function getJobAnalysis(id: string): Promise<JobAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}/analysis`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Job analysis not found.", undefined, response.status);
  }

  return body.data as JobAnalysis;
}

/**
 * Perform deterministic gap comparison between a candidate's Skill Matrix
 * and a target Job Description.
 */
export async function compareGap(
  matrix?: SkillMatrix,
  job?: JobExtraction,
  resumeId?: string,
  jobId?: string
): Promise<GapAnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/gap/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ matrix, job, resumeId, jobId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to execute gap comparison.", body.code, response.status);
  }

  return body.data as GapAnalysisReport;
}

/**
 * Retrieve a previously computed gap analysis report
 */
export async function getGapReport(id: string): Promise<GapAnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/gap/${id}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Gap analysis report not found.", undefined, response.status);
  }

  return body.data as GapAnalysisReport;
}

/**
 * Retrieve the latest computed gap analysis report
 */
export async function getLatestGapReport(): Promise<GapAnalysisReport | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/gap/latest`, {
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.data || null;
  } catch {
    return null;
  }
}

/**
 * Generate evidence-grounded resume optimization report
 */
export async function optimizeResume(
  resume?: ResumeExtraction,
  matrix?: SkillMatrix,
  job?: JobExtraction,
  gapReport?: GapAnalysisReport,
  resumeId?: string,
  jobId?: string
): Promise<ResumeOptimizationReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimizer/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume, matrix, job, gapReport, resumeId, jobId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to generate resume optimization report.", body.code, response.status);
  }

  return body.data as ResumeOptimizationReport;
}

/**
 * Retrieve a previously computed resume optimization report
 */
export async function getOptimizationReport(id: string): Promise<ResumeOptimizationReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimizer/${id}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Resume optimization report not found.", undefined, response.status);
  }

  return body.data as ResumeOptimizationReport;
}

/**
 * Retrieve the latest computed resume optimization report
 */
export async function getLatestOptimizationReport(): Promise<ResumeOptimizationReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimizer/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No resume optimization report found.", undefined, response.status);
  }

  return body.data as ResumeOptimizationReport;
}

/**
 * PHASE 7: Generate a job-specific tailored resume recommendation
 */
export async function tailorResume(
  resume?: any,
  matrix?: any,
  job?: any,
  gapReport?: any,
  resumeId?: string,
  jobId?: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimizer/tailor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume, matrix, job, gapReport, resumeId, jobId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to generate job-specific tailored resume.", body.code, response.status);
  }

  return body.data;
}

/**
 * Retrieve the latest job-specific tailored resume
 */
export async function getLatestTailoredResume(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimizer/tailored/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No job-specific tailored resume found.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 8: Evaluate Career Readiness
 */
export async function evaluateReadiness(
  matrix: SkillMatrix,
  resume?: ResumeExtraction | null,
  job?: JobExtraction | null,
  gapReport?: GapAnalysisReport | null
): Promise<CareerReadinessReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/readiness/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ matrix, resume, job, gapReport }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to evaluate career readiness.", body.code, response.status);
  }

  return body.data as CareerReadinessReport;
}

/**
 * PHASE 8: Retrieve latest Career Readiness evaluation
 */
export async function getLatestReadiness(): Promise<CareerReadinessReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/readiness/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No career readiness report found.", undefined, response.status);
  }

  return body.data as CareerReadinessReport;
}

/**
 * PHASE 9: Start an interview simulation session
 */
export async function startInterviewSession(params: {
  resumeId?: string;
  jobId?: string;
  customQuestionsCount?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to start interview session.", body.code, response.status);
  }

  return body.data;
}

/**
 * PHASE 9: Submit an answer to the current interview question
 */
export async function submitInterviewAnswer(params: {
  sessionId: string;
  questionId: string;
  answer: string;
}): Promise<{ session: any; exchange: any }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to evaluate answer.", body.code, response.status);
  }

  return body.data;
}

/**
 * PHASE 9: Complete an interview session
 */
export async function completeInterviewSession(sessionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to complete interview.", body.code, response.status);
  }

  return body.data;
}

/**
 * PHASE 9: Retrieve an interview session by ID
 */
export async function getInterviewSession(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/session/${encodeURIComponent(id)}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Interview session not found.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 9: Retrieve interview history
 */
export async function getInterviewHistory(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/history`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to fetch interview history.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 9: Retrieve latest interview session
 */
export async function getLatestInterviewSession(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulator/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No interview session found.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 10: Generate tailored project recommendations targeting candidate gaps
 */
export async function getProjectRecommendations(params: {
  job?: any;
  matrix?: any;
  gapReport?: any;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to generate project recommendations.", body.code, response.status);
  }

  return body.data;
}

/**
 * PHASE 10: Retrieve latest project recommendations
 */
export async function getLatestProjectRecommendations(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No project recommendations found.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 10: Generate an in-depth Project Blueprint
 */
export async function generateProjectBlueprint(projectId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/blueprint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to generate project blueprint.", body.code, response.status);
  }

  return body.data;
}

/**
 * PHASE 10: Fetch an existing Project Blueprint
 */
export async function getProjectBlueprint(projectId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/projects/blueprint/${encodeURIComponent(projectId)}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Project blueprint not found.", undefined, response.status);
  }

  return body.data;
}

/**
 * PHASE 11: Connect to GitHub via authorized API and generate evidence report
 */
export async function connectGithub(params: {
  username: string;
  token?: string;
  resume?: ResumeExtraction | null;
  matrix?: SkillMatrix | null;
}): Promise<GithubEvidenceReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to connect to GitHub.", body.code, response.status);
  }

  return body.data as GithubEvidenceReport;
}

/**
 * PHASE 11: Cross-verify GitHub repository evidence against resume claims
 */
export async function compareGithubEvidence(params: {
  username?: string;
  token?: string;
  resume: ResumeExtraction;
  matrix?: SkillMatrix | null;
}): Promise<GithubEvidenceReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to compare GitHub evidence.", body.code, response.status);
  }

  return body.data as GithubEvidenceReport;
}

/**
 * PHASE 11: Check current GitHub connection status
 */
export async function getGithubStatus(): Promise<{
  connected: boolean;
  username: string | null;
  repositoriesCount: number;
  mode: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/status`);
  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(body.message || "Failed to get GitHub status.", undefined, response.status);
  }

  return body;
}

/**
 * PHASE 11: Fetch latest cached GitHub evidence report
 */
export async function getLatestGithubReport(): Promise<GithubEvidenceReport | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/report/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    return null;
  }

  return body.data as GithubEvidenceReport;
}

/**
 * PHASE 11: Fetch analyzed repositories list
 */
export async function getGithubRepositories(): Promise<AnalyzedRepository[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/repositories`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to get GitHub repositories.", body.code, response.status);
  }

  return body.data as AnalyzedRepository[];
}

/**
 * PHASE 11: Legacy GitHub sync
 */
export async function syncGithub(params?: {
  username?: string;
  token?: string;
  resume?: ResumeExtraction | null;
  matrix?: SkillMatrix | null;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/github/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params || {}),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(body.message || "GitHub sync failed", undefined, response.status);
  }
  return body;
}

/**
 * LaTeX Studio: Free compilation of LaTeX source into PDF
 */
export async function compileLatex(
  texSource: string,
  engine: "pdflatex" | "xelatex" = "pdflatex"
): Promise<{ pdfBase64: string; engineUsed: string; compileDurationMs: number }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/latex/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ texSource, engine }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    const errorMsg = body.message || "Failed to compile LaTeX document.";
    const err = new ApiError(errorMsg, body.code, response.status);
    (err as any).log = body.log;
    throw err;
  }

  return body.data;
}

/**
 * LaTeX Studio: Generate ATS-friendly Jake's Resume LaTeX source code
 */
export async function generateLatex(
  resume: ResumeExtraction,
  tailored?: any | null,
  templateId = "jakes-resume"
): Promise<{ texSource: string; templateId: string; atsFriendly: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/latex/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume, tailored, templateId }),
  });

  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Failed to generate LaTeX document.", body.code, response.status);
  }

  return body.data;
}

/**
 * LaTeX Studio: Check compiler engines status
 */
export async function getLatexStatus(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/latex/status`);
  return await response.json();
}

/**
 * PHASE 13: Authentication & Profile APIs
 */

export async function signupUser(data: SignupRequest): Promise<{ success: boolean; message: string; email?: string; requiresVerification?: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to register account.", undefined, response.status);
  }
  return body;
}

export async function loginUser(data: LoginRequest): Promise<{ success: boolean; message: string; user: SafeUser; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    const err = new ApiError(body.message || "Invalid email or password.", undefined, response.status);
    (err as any).requiresVerification = body.requiresVerification;
    (err as any).email = body.email || data.email;
    throw err;
  }
  if (body.token) {
    setStoredToken(body.token);
  }
  return body;
}

export async function verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string; user?: SafeUser; token?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "OTP verification failed.", undefined, response.status);
  }
  if (body.token) {
    setStoredToken(body.token);
  }
  return body;
}

export async function resendEmailOtp(email: string): Promise<{ success: boolean; message: string; email?: string; requiresVerification?: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to resend verification OTP.", undefined, response.status);
  }
  return body;
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    const body = await response.json();
    return body;
  } finally {
    clearStoredToken();
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearStoredToken();
      }
      return null;
    }
    const body = await response.json();
    return body.user || null;
  } catch {
    return null;
  }
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Email verification failed.", undefined, response.status);
  }
  return body;
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to process forgot password request.", undefined, response.status);
  }
  return body;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to reset password.", undefined, response.status);
  }
  return body;
}

export async function getUserProfile(): Promise<SafeUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to load user profile.", undefined, response.status);
  }
  return body.user;
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<SafeUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to update profile.", undefined, response.status);
  }
  return body.user;
}

/**
 * PHASE 14: Get OAuth Login URL for a provider (Google, GitHub, LinkedIn)
 */
export function getOAuthLoginUrl(provider: OAuthProvider): string {
  return `${API_BASE_URL}/api/auth/${provider}`;
}

/**
 * PHASE 14: Get OAuth Account Link URL for a provider
 */
export function getOAuthLinkUrl(provider: OAuthProvider): string {
  return `${API_BASE_URL}/api/auth/${provider}?action=link`;
}

/**
 * PHASE 14: Retrieve connected social providers for current user
 */
export async function getConnectedProviders(): Promise<{
  success: boolean;
  providers: LinkedProvider[];
  hasPassword: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/providers`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || "Failed to load connected accounts.", undefined, response.status);
  }
  return body;
}

/**
 * PHASE 14: Disconnect an OAuth provider
 */
export async function disconnectProvider(provider: OAuthProvider): Promise<{
  success: boolean;
  message: string;
  user: SafeUser;
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/providers/${provider}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || `Failed to disconnect ${provider} account.`, undefined, response.status);
  }
  return body;
}




