import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  GapAnalysisReport,
  ResumeOptimizationReport,
} from "@skilltwin/contracts";
import { ResumeOptimizerEngine, resumeOptimizerEngine } from "./optimizer.engine.js";
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
    private readonly repository: OptimizerRepository = optimizerRepository,
    private readonly resumes: ResumeRepository = resumeRepository,
    private readonly jobs: JobRepository = jobRepository,
    private readonly gaps: GapRepository = gapRepository,
    private readonly gapEng: GapEngine = gapEngine,
  ) {}

  async optimize(options: OptimizeOptions): Promise<ResumeOptimizationReport> {
    let resume = options.resume;
    let matrix = options.matrix;
    let job = options.job;
    let gapReport = options.gapReport;

    // 1. Resolve resume & matrix
    if (!resume && options.resumeId) {
      resume = this.resumes.getResume(options.resumeId);
      if (!resume) {
        throw new Error(`Resume with ID '${options.resumeId}' not found.`);
      }
    }
    if (!matrix && options.resumeId) {
      matrix = this.resumes.getMatrix(options.resumeId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${options.resumeId}' not found.`);
      }
    }

    // 2. Resolve job
    if (!job && options.jobId) {
      job = this.jobs.getJob(options.jobId);
      if (!job) {
        throw new Error(`Job description with ID '${options.jobId}' not found.`);
      }
    }

    // Fallbacks if not provided directly
    if (!resume) {
      resume = this.resumes.getLatestResume();
    }
    if (!job) {
      job = this.jobs.getLatestJob();
    }

    if (!resume) {
      throw new Error("A valid resume or resumeId is required for resume optimization.");
    }
    if (!job) {
      throw new Error("A valid job description or jobId is required for resume optimization.");
    }

    if (!matrix) {
      matrix = this.resumes.getMatrix(resume.id);
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
}

export const optimizerService = new OptimizerService();
