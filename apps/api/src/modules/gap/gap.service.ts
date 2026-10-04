import type {
  SkillMatrix,
  JobExtraction,
  GapAnalysisReport,
} from "@skilltwin/contracts";
import { gapEngine, GapEngine } from "./gap.engine.js";
import { gapRepository, GapRepository } from "./gap.repository.js";
import { resumeRepository, ResumeRepository } from "../resume/resume.repository.js";
import { jobRepository, JobRepository } from "../job/job.repository.js";

export interface CompareOptions {
  matrix?: SkillMatrix;
  job?: JobExtraction;
  resumeId?: string;
  jobId?: string;
}

export class GapService {
  constructor(
    private readonly engine: GapEngine = gapEngine,
    private readonly repository: GapRepository = gapRepository,
    private readonly resumes: ResumeRepository = resumeRepository,
    private readonly jobs: JobRepository = jobRepository,
  ) {}

  /**
   * Run comparison either by supplying matrix & job objects directly,
   * or by providing existing resumeId & jobId.
   */
  async compare(options: CompareOptions): Promise<GapAnalysisReport> {
    let matrix = options.matrix;
    let job = options.job;

    // If resumeId provided, fetch matrix
    if (!matrix && options.resumeId) {
      matrix = this.resumes.getMatrix(options.resumeId);
      if (!matrix) {
        throw new Error(`Skill matrix for resume '${options.resumeId}' not found.`);
      }
    }

    // If jobId provided, fetch job
    if (!job && options.jobId) {
      job = this.jobs.getJob(options.jobId);
      if (!job) {
        throw new Error(`Job description with ID '${options.jobId}' not found.`);
      }
    }

    if (!matrix) {
      throw new Error("A valid Skill Matrix or resumeId is required for gap comparison.");
    }
    if (!job) {
      throw new Error("A valid Job Description or jobId is required for gap comparison.");
    }

    // Perform comparison using deterministic GapEngine
    const report = this.engine.compare(matrix, job);

    // Save report in repository
    this.repository.saveReport(report);

    return report;
  }

  getReport(id: string): GapAnalysisReport | undefined {
    return this.repository.getReport(id);
  }

  getLatestReport(): GapAnalysisReport | undefined {
    return this.repository.getLatestReport();
  }

  getReportByResumeAndJob(resumeId: string, jobId: string): GapAnalysisReport | undefined {
    return this.repository.getReportByResumeAndJob(resumeId, jobId);
  }
}

export const gapService = new GapService();
