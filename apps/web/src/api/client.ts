import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  JobAnalysis,
  GapAnalysisReport,
} from "@skilltwin/contracts";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

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
    },
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
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/${id}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Resume not found.", undefined, response.status);
  }

  return body.data as ResumeExtraction;
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
    },
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
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Job description not found.", undefined, response.status);
  }

  return body.data as JobExtraction;
}

/**
 * Retrieve the analysis summary for a job description
 */
export async function getJobAnalysis(id: string): Promise<JobAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}/analysis`);
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
    },
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
  const response = await fetch(`${API_BASE_URL}/api/v1/gap/${id}`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "Gap analysis report not found.", undefined, response.status);
  }

  return body.data as GapAnalysisReport;
}

/**
 * Retrieve the latest computed gap analysis report
 */
export async function getLatestGapReport(): Promise<GapAnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/gap/latest`);
  const body = await response.json();

  if (!response.ok || body.status === "error") {
    throw new ApiError(body.message || "No gap analysis found.", undefined, response.status);
  }

  return body.data as GapAnalysisReport;
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
