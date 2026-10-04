import type { ResumeExtraction, SkillMatrix } from "@skilltwin/contracts";
import type { GeminiResumeAnalysis } from "../../services/ai/schemas/resume-schema.js";

export class ResumeRepository {
  private resumes: Map<string, ResumeExtraction> = new Map();
  private matrices: Map<string, SkillMatrix> = new Map();
  private rawAnalyses: Map<string, GeminiResumeAnalysis> = new Map();
  private latestResumeId: string | null = null;

  saveResume(resume: ResumeExtraction): void {
    this.resumes.set(resume.id, resume);
    this.latestResumeId = resume.id;
  }

  getResume(id: string): ResumeExtraction | undefined {
    return this.resumes.get(id);
  }

  getLatestResume(): ResumeExtraction | undefined {
    if (!this.latestResumeId) return undefined;
    return this.resumes.get(this.latestResumeId);
  }

  saveMatrix(matrix: SkillMatrix): void {
    this.matrices.set(matrix.resumeId, matrix);
  }

  getMatrix(resumeId: string): SkillMatrix | undefined {
    return this.matrices.get(resumeId);
  }

  saveAnalysis(resumeId: string, analysis: GeminiResumeAnalysis): void {
    this.rawAnalyses.set(resumeId, analysis);
  }

  getAnalysis(resumeId: string): GeminiResumeAnalysis | undefined {
    return this.rawAnalyses.get(resumeId);
  }

  clear(): void {
    this.resumes.clear();
    this.matrices.clear();
    this.rawAnalyses.clear();
    this.latestResumeId = null;
  }
}

export const resumeRepository = new ResumeRepository();
