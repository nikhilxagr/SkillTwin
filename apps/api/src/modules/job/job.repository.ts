import type { JobExtraction, JobAnalysis } from "@skilltwin/contracts";
import { dbService } from "../database/database.service.js";
import type { JobAnalysisDoc } from "../database/database.types.js";

export class JobRepository {
  private readonly jobs = new Map<string, { job: JobExtraction; userId: string }>();
  private readonly analyses = new Map<string, { analysis: JobAnalysis; userId: string }>();
  private readonly latestUserJob = new Map<string, string>(); // userId -> jobId
  private globalLatestJobId: string | null = null;

  async saveJob(job: JobExtraction, userId = "default-user"): Promise<void> {
    this.jobs.set(job.id, { job, userId });
    this.latestUserJob.set(userId, job.id);
    this.globalLatestJobId = job.id;
  }

  async saveAnalysis(analysis: JobAnalysis, userId = "default-user"): Promise<void> {
    this.analyses.set(analysis.id, { analysis, userId });
    if (analysis.job?.id) {
      this.analyses.set(analysis.job.id, { analysis, userId });
    }

    if (analysis.job) {
      const doc: JobAnalysisDoc = {
        _id: analysis.id,
        userId,
        company: analysis.job.company || "",
        role: analysis.job.title || "",
        requirements: ((analysis as any).requirements || analysis.job) as any,
        jobData: analysis.job,
        analysis,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbService.jobAnalyses.insertOne(doc);
    }
  }

  getJob(id: string, userId?: string): JobExtraction | undefined {
    const entry = this.jobs.get(id);
    if (!entry) return undefined;

    if (userId && entry.userId !== userId) {
      return undefined;
    }

    return entry.job;
  }

  getAnalysis(id: string, userId?: string): JobAnalysis | undefined {
    const entry = this.analyses.get(id) || this.analyses.get(`analysis-${id}`);
    if (!entry) return undefined;

    if (userId && entry.userId !== userId) {
      return undefined;
    }

    return entry.analysis;
  }

  getLatestJob(userId?: string): JobExtraction | undefined {
    if (userId) {
      const jobId = this.latestUserJob.get(userId);
      if (!jobId) return undefined;
      return this.getJob(jobId, userId);
    }

    if (!this.globalLatestJobId) return undefined;
    const entry = this.jobs.get(this.globalLatestJobId);
    return entry?.job;
  }

  listJobs(userId?: string): JobExtraction[] {
    const list: JobExtraction[] = [];
    for (const entry of this.jobs.values()) {
      if (!userId || entry.userId === userId) {
        list.push(entry.job);
      }
    }
    return list;
  }

  deleteJob(id: string, userId: string): boolean {
    const entry = this.jobs.get(id);
    if (!entry || entry.userId !== userId) {
      return false;
    }

    this.jobs.delete(id);
    this.analyses.delete(id);
    this.analyses.delete(`analysis-${id}`);

    if (this.latestUserJob.get(userId) === id) {
      const remaining = this.listJobs(userId);
      if (remaining.length > 0) {
        this.latestUserJob.set(userId, remaining[remaining.length - 1].id);
      } else {
        this.latestUserJob.delete(userId);
      }
    }

    dbService.jobAnalyses.deleteOne({ _id: id, userId });
    return true;
  }

  clear(): void {
    this.jobs.clear();
    this.analyses.clear();
    this.latestUserJob.clear();
    this.globalLatestJobId = null;
  }
}

export const jobRepository = new JobRepository();
