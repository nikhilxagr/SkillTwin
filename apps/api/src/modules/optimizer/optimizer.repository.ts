import type { ResumeOptimizationReport, JobSpecificTailoredResume } from "@skilltwin/contracts";

export class OptimizerRepository {
  private readonly reports: Map<string, ResumeOptimizationReport> = new Map();
  private readonly pairIndex: Map<string, string> = new Map(); // `${resumeId}:${jobId}` -> reportId
  private latestReportId: string | null = null;

  private readonly tailoredResumes: Map<string, JobSpecificTailoredResume> = new Map();
  private readonly tailoredPairIndex: Map<string, string> = new Map();
  private latestTailoredId: string | null = null;

  saveReport(report: ResumeOptimizationReport): void {
    this.reports.set(report.id, report);
    this.pairIndex.set(`${report.resumeId}:${report.jobId}`, report.id);
    this.latestReportId = report.id;
  }

  getReport(id: string): ResumeOptimizationReport | undefined {
    return this.reports.get(id);
  }

  getReportByResumeAndJob(resumeId: string, jobId: string): ResumeOptimizationReport | undefined {
    const reportId = this.pairIndex.get(`${resumeId}:${jobId}`);
    if (!reportId) return undefined;
    return this.reports.get(reportId);
  }

  getLatestReport(): ResumeOptimizationReport | undefined {
    if (!this.latestReportId) return undefined;
    return this.reports.get(this.latestReportId);
  }

  listReports(): ResumeOptimizationReport[] {
    return Array.from(this.reports.values());
  }

  saveTailoredResume(tailored: JobSpecificTailoredResume): void {
    this.tailoredResumes.set(tailored.id, tailored);
    this.tailoredPairIndex.set(`${tailored.masterResumeId}:${tailored.selectedJobId}`, tailored.id);
    this.latestTailoredId = tailored.id;
  }

  getTailoredResume(id: string): JobSpecificTailoredResume | undefined {
    return this.tailoredResumes.get(id);
  }

  getTailoredResumeByResumeAndJob(resumeId: string, jobId: string): JobSpecificTailoredResume | undefined {
    const tailoredId = this.tailoredPairIndex.get(`${resumeId}:${jobId}`);
    if (!tailoredId) return undefined;
    return this.tailoredResumes.get(tailoredId);
  }

  getLatestTailoredResume(): JobSpecificTailoredResume | undefined {
    if (!this.latestTailoredId) return undefined;
    return this.tailoredResumes.get(this.latestTailoredId);
  }

  clear(): void {
    this.reports.clear();
    this.pairIndex.clear();
    this.latestReportId = null;
    this.tailoredResumes.clear();
    this.tailoredPairIndex.clear();
    this.latestTailoredId = null;
  }
}

export const optimizerRepository = new OptimizerRepository();
