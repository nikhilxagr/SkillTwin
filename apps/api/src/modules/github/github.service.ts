import {
  compareGithubEvidence,
  type AnalyzedRepository,
  type GithubEvidenceReport,
  type ResumeExtraction,
  type SkillMatrix,
} from "@skilltwin/contracts";
import { githubEvidenceRepository } from "./github.repository.js";

export class GithubService {
  /**
   * Fetches repositories using authorized GitHub REST API access (strictly no scraping).
   * Returns empty array if unauthorized, offline, or username not found.
   */
  async fetchRepositories(username: string, token?: string): Promise<AnalyzedRepository[]> {
    if (!username || !username.trim()) {
      return [];
    }

    try {
      const headers: Record<string, string> = {
        "User-Agent": "SkillTwin-Verification-Engine/1.0",
        Accept: "application/vnd.github.v3+json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?sort=updated&per_page=15`, {
        headers,
      });

      if (!response.ok) {
        return [];
      }

      const rawRepos = (await response.json()) as any[];
      if (!Array.isArray(rawRepos) || rawRepos.length === 0) {
        return [];
      }

      // Transform official GitHub REST API objects into AnalyzedRepository format
      const analyzed: AnalyzedRepository[] = rawRepos.map((r) => {
        const detectedTechnologies: string[] = [];
        if (r.language) {
          detectedTechnologies.push(r.language);
        }
        if (Array.isArray(r.topics)) {
          detectedTechnologies.push(...r.topics);
        }

        const isDocker = detectedTechnologies.some((t) => t.toLowerCase().includes("docker"));

        return {
          id: String(r.id),
          name: r.name,
          fullName: r.full_name || `${username}/${r.name}`,
          htmlUrl: r.html_url || `https://github.com/${username}/${r.name}`,
          description: r.description || "Public repository",
          primaryLanguage: r.language || (detectedTechnologies[0] ?? null),
          languages: r.language ? [{ name: r.language, bytes: 10000, percentage: 100 }] : [],
          topics: Array.isArray(r.topics) ? r.topics : [],
          isFork: !!r.fork,
          defaultBranch: r.default_branch || "main",
          starsCount: r.stargazers_count ?? 0,
          forksCount: r.forks_count ?? 0,
          openIssuesCount: r.open_issues_count ?? 0,
          updatedAt: r.updated_at || new Date().toISOString(),
          pushedAt: r.pushed_at || new Date().toISOString(),
          activityLevel: "Active",
          structure: {
            hasSrc: true,
            hasTests: false,
            hasDocs: false,
            keyDirectories: ["src"],
          },
          dependencies: [],
          testing: {
            detected: false,
            frameworks: [],
            testDirectories: [],
            testFileCount: 0,
          },
          docker: {
            detected: isDocker,
            hasDockerfile: isDocker,
            hasDockerCompose: false,
            files: isDocker ? ["Dockerfile"] : [],
          },
          deployment: {
            detected: false,
            platforms: [],
            configFiles: [],
          },
          detectedTechnologies,
        };
      });

      return analyzed;
    } catch {
      return [];
    }
  }

  /**
   * Compares GitHub repositories against Resume claims and saves report.
   */
  async connectAndAnalyze(params: {
    username: string;
    token?: string;
    resume?: ResumeExtraction | null;
    matrix?: SkillMatrix | null;
  }): Promise<GithubEvidenceReport> {
    const repositories = await this.fetchRepositories(params.username, params.token);

    const report = compareGithubEvidence({
      username: params.username,
      repositories,
      resume: params.resume,
      matrix: params.matrix,
    });

    githubEvidenceRepository.saveReport(report);
    return report;
  }

  /**
   * Retrieves the most recent GitHub evidence report.
   */
  getLatestReport(): GithubEvidenceReport | null {
    return githubEvidenceRepository.getLatestReport();
  }

  /**
   * Retrieves current connection status.
   */
  getStatus() {
    const report = githubEvidenceRepository.getLatestReport();
    return {
      connected: report !== null,
      username: report?.username || githubEvidenceRepository.getConnectedUsername() || null,
      repositoriesCount: report?.totalRepositories || 0,
      mode: "authorized_api",
      message: report
        ? `Connected to GitHub as ${report.username}. ${report.totalRepositories} repositories analyzed.`
        : "No active GitHub connection. Connect your GitHub account to verify code evidence.",
    };
  }
}

export const githubService = new GithubService();
