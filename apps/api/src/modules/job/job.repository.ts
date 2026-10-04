import type { JobExtraction, JobAnalysis } from "@skilltwin/contracts";

export class JobRepository {
  private readonly jobs: Map<string, JobExtraction> = new Map();
  private readonly analyses: Map<string, JobAnalysis> = new Map();
  private latestJobId: string | null = null;

  saveJob(job: JobExtraction): void {
    this.jobs.set(job.id, job);
    this.latestJobId = job.id;
  }

  saveAnalysis(analysis: JobAnalysis): void {
    this.analyses.set(analysis.id, analysis);
    if (analysis.job?.id) {
      this.analyses.set(analysis.job.id, analysis);
    }
  }

  getJob(id: string): JobExtraction | undefined {
    return this.jobs.get(id);
  }

  getAnalysis(id: string): JobAnalysis | undefined {
    return this.analyses.get(id) || this.analyses.get(`analysis-${id}`);
  }

  getLatestJob(): JobExtraction | undefined {
    if (!this.latestJobId) return undefined;
    return this.jobs.get(this.latestJobId);
  }

  listJobs(): JobExtraction[] {
    return Array.from(this.jobs.values());
  }

  clear(): void {
    this.jobs.clear();
    this.analyses.clear();
    this.latestJobId = null;
  }
}

export const jobRepository = new JobRepository();
