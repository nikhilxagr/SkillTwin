import type { ResumeOptimizationReport } from "@skilltwin/contracts";

export class OptimizerRepository {
  private readonly reports: Map<string, ResumeOptimizationReport> = new Map();
  private readonly pairIndex: Map<string, string> = new Map(); // `${resumeId}:${jobId}` -> reportId
  private latestReportId: string | null = null;

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

  clear(): void {
    this.reports.clear();
    this.pairIndex.clear();
    this.latestReportId = null;
  }
}

export const optimizerRepository = new OptimizerRepository();
