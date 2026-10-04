import type {
  GithubEvidenceReport,
  AnalyzedRepository,
} from "@skilltwin/contracts";

export class GithubEvidenceRepository {
  private latestReport: GithubEvidenceReport | null = null;
  private connectedUsername: string | null = null;
  private repositories: AnalyzedRepository[] = [];

  saveReport(report: GithubEvidenceReport): void {
    this.latestReport = report;
    this.connectedUsername = report.username;
    this.repositories = report.analyzedRepositories;
  }

  getLatestReport(): GithubEvidenceReport | null {
    return this.latestReport;
  }

  getConnectedUsername(): string | null {
    return this.connectedUsername;
  }

  getRepositories(): AnalyzedRepository[] {
    return this.repositories;
  }

  clear(): void {
    this.latestReport = null;
    this.connectedUsername = null;
    this.repositories = [];
  }
}

export const githubEvidenceRepository = new GithubEvidenceRepository();
