import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  GapAnalysisReport,
  ResumeOptimizationReport,
  JobSpecificTailoredResume,
} from "@skilltwin/contracts";
import { ResumeOptimizerEngine, resumeOptimizerEngine } from "./optimizer.engine.js";
import { JobTailoringEngine, jobTailoringEngine } from "./tailoring.engine.js";
import { OptimizerRepository, optimizerRepository } from "./optimizer.repository.js";
import { resumeRepository, ResumeRepository } from "../resume/resume.repository.js";
import { jobRepository, JobRepository } from "../job/job.repository.js";
import { gapRepository, GapRepository } from "../gap/gap.repository.js";
import { gapEngine, GapEngine } from "../gap/gap.engine.js";

export interface OptimizeOptions {
  resume?: ResumeExtraction;
  matrix?: SkillMatrix;
  job?: JobExtraction;
  gapReport?: GapAnalysisReport;
  resumeId?: string;
  jobId?: string;
}

export class OptimizerService {
  constructor(
    private readonly engine: ResumeOptimizerEngine = resumeOptimizerEngine,
    private readonly tailoringEngine: JobTailoringEngine = jobTailoringEngine,
    private readonly repository: OptimizerRepository = optimizerRepository,
    private readonly resumes: ResumeRepository = resumeRepository,
    private readonly jobs: JobRepository = jobRepository,
    private readonly gaps: GapRepository = gapRepository,
    private readonly gapEng: GapEngine = gapEngine,
  ) {}

  async optimize(options: OptimizeOptions, userId?: string): Promise<ResumeOptimizationReport> {
    let resume = options.resume;
    let matrix = options.matrix;
    let job = options.job;
    let gapReport = options.gapReport;

    // 1. Resolve resume & matrix
    if (!resume && options.resumeId) {
      resume = this.resumes.getResume(options.resumeId, userId);
      if (!resume) {
        throw new Error(`Resume with ID '${options.resumeId}' not found.`);
      }
    }
    if (!matrix && options.resumeId) {
      matrix = this.resumes.getMatrix(options.resumeId, userId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${options.resumeId}' not found.`);
      }
    }

    // 2. Resolve job
    if (!job && options.jobId) {
      job = this.jobs.getJob(options.jobId, userId);
      if (!job) {
        throw new Error(`Job description with ID '${options.jobId}' not found.`);
      }
    }

    // Fallbacks if not provided directly
    if (!resume) {
      resume = this.resumes.getLatestResume(userId);
    }
    if (!job) {
      job = this.jobs.getLatestJob(userId);
    }

    if (!resume) {
      throw new Error("A valid resume or resumeId is required for resume optimization.");
    }
    if (!job) {
      throw new Error("A valid job description or jobId is required for resume optimization.");
    }

    if (!matrix) {
      matrix = this.resumes.getMatrix(resume.id, userId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${resume.id}' not found.`);
      }
    }

    // 3. Resolve gap report
    if (!gapReport) {
      gapReport = this.gaps.getReportByResumeAndJob(resume.id, job.id);
      if (!gapReport) {
        // Compute gap report deterministically on the fly
        gapReport = this.gapEng.compare(matrix, job);
        this.gaps.saveReport(gapReport);
      }
    }

    // 4. Generate optimization report
    const report = this.engine.optimize({
      resume,
      matrix,
      job,
      gapReport,
    });

    // 5. Save report
    this.repository.saveReport(report);

    return report;
  }

  getReport(id: string): ResumeOptimizationReport | undefined {
    return this.repository.getReport(id);
  }

  getLatestReport(): ResumeOptimizationReport | undefined {
    return this.repository.getLatestReport();
  }

  getReportByResumeAndJob(resumeId: string, jobId: string): ResumeOptimizationReport | undefined {
    return this.repository.getReportByResumeAndJob(resumeId, jobId);
  }

  async tailor(options: OptimizeOptions, userId?: string): Promise<JobSpecificTailoredResume> {
    let resume = options.resume;
    let matrix = options.matrix;
    let job = options.job;
    let gapReport = options.gapReport;

    // 1. Resolve resume & matrix
    if (!resume && options.resumeId) {
      resume = this.resumes.getResume(options.resumeId, userId);
      if (!resume) {
        throw new Error(`Resume with ID '${options.resumeId}' not found.`);
      }
    }
    if (!matrix && options.resumeId) {
      matrix = this.resumes.getMatrix(options.resumeId, userId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${options.resumeId}' not found.`);
      }
    }

    // 2. Resolve job
    if (!job && options.jobId) {
      job = this.jobs.getJob(options.jobId, userId);
      if (!job) {
        throw new Error(`Job description with ID '${options.jobId}' not found.`);
      }
    }

    // Fallbacks if not provided directly
    if (!resume) {
      resume = this.resumes.getLatestResume(userId);
    }
    if (!job) {
      job = this.jobs.getLatestJob(userId);
    }

    if (!resume) {
      throw new Error("A valid master resume or resumeId is required for tailoring.");
    }
    if (!job) {
      throw new Error("A valid target job description or jobId is required for tailoring.");
    }

    if (!matrix) {
      matrix = this.resumes.getMatrix(resume.id, userId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${resume.id}' not found.`);
      }
    }

    // 3. Resolve gap report
    if (!gapReport) {
      gapReport = this.gaps.getReportByResumeAndJob(resume.id, job.id);
      if (!gapReport) {
        gapReport = this.gapEng.compare(matrix, job);
        this.gaps.saveReport(gapReport);
      }
    }

    // 4. Generate job-specific tailored resume
    const tailored = this.tailoringEngine.tailor({
      resume,
      matrix,
      job,
      gapReport,
    });

    // 5. Save tailored resume
    this.repository.saveTailoredResume(tailored);

    return tailored;
  }

  getTailoredResume(id: string): JobSpecificTailoredResume | undefined {
    return this.repository.getTailoredResume(id);
  }

  getLatestTailoredResume(): JobSpecificTailoredResume | undefined {
    return this.repository.getLatestTailoredResume();
  }

  getTailoredResumeByResumeAndJob(resumeId: string, jobId: string): JobSpecificTailoredResume | undefined {
    return this.repository.getTailoredResumeByResumeAndJob(resumeId, jobId);
  }
}

export const optimizerService = new OptimizerService();
