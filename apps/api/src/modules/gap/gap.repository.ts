import type { GapAnalysisReport } from "@skilltwin/contracts";

export class GapRepository {
  private readonly reports: Map<string, GapAnalysisReport> = new Map();
  private readonly pairIndex: Map<string, string> = new Map(); // `${resumeId}:${jobId}` -> reportId
  private latestReportId: string | null = null;

  saveReport(report: GapAnalysisReport): void {
    this.reports.set(report.id, report);
    this.pairIndex.set(`${report.resumeId}:${report.jobId}`, report.id);
    this.latestReportId = report.id;
  }

  getReport(id: string): GapAnalysisReport | undefined {
    return this.reports.get(id);
  }

  getReportByResumeAndJob(resumeId: string, jobId: string): GapAnalysisReport | undefined {
    const reportId = this.pairIndex.get(`${resumeId}:${jobId}`);
    if (!reportId) return undefined;
    return this.reports.get(reportId);
  }

  getLatestReport(): GapAnalysisReport | undefined {
    if (!this.latestReportId) return undefined;
    return this.reports.get(this.latestReportId);
  }

  listReports(): GapAnalysisReport[] {
    return Array.from(this.reports.values());
  }

  clear(): void {
    this.reports.clear();
    this.pairIndex.clear();
    this.latestReportId = null;
  }
}

export const gapRepository = new GapRepository();
