import type { ResumeExtraction, SkillMatrix } from "@skilltwin/contracts";
import type { GeminiResumeAnalysis } from "../../services/ai/schemas/resume-schema.js";
import { dbService } from "../database/database.service.js";
import type { ResumeDoc, SkillProfileDoc } from "../database/database.types.js";

export class ResumeRepository {
  private resumes = new Map<string, { resume: ResumeExtraction; userId: string }>();
  private matrices = new Map<string, { matrix: SkillMatrix; userId: string }>();
  private rawAnalyses = new Map<string, { analysis: GeminiResumeAnalysis; userId: string }>();
  private latestUserResume = new Map<string, string>(); // userId -> resumeId
  private globalLatestResumeId: string | null = null;

  async saveResume(
    resume: ResumeExtraction,
    userId = "default-user",
    rawText = ""
  ): Promise<void> {
    this.resumes.set(resume.id, { resume, userId });
    this.latestUserResume.set(userId, resume.id);
    this.globalLatestResumeId = resume.id;

    // Save to database collection
    const doc: ResumeDoc = {
      _id: resume.id,
      userId,
      fileName: resume.fileName,
      fileType: resume.fileType,
      fileSizeBytes: resume.fileSizeBytes,
      extractedText: rawText || resume.rawText,
      resumeData: resume,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbService.resumes.insertOne(doc);
  }

  getResume(id: string, userId?: string): ResumeExtraction | undefined {
    const entry = this.resumes.get(id);
    if (!entry) return undefined;

    // Enforce ownership: if userId is provided, must match
    if (userId && entry.userId !== userId) {
      return undefined;
    }

    return entry.resume;
  }

  getLatestResume(userId?: string): ResumeExtraction | undefined {
    if (userId) {
      const resumeId = this.latestUserResume.get(userId);
      if (!resumeId) return undefined;
      return this.getResume(resumeId, userId);
    }

    if (!this.globalLatestResumeId) return undefined;
    const entry = this.resumes.get(this.globalLatestResumeId);
    return entry?.resume;
  }

  listResumes(userId: string): ResumeExtraction[] {
    const list: ResumeExtraction[] = [];
    for (const entry of this.resumes.values()) {
      if (entry.userId === userId) {
        list.push(entry.resume);
      }
    }
    return list;
  }

  deleteResume(id: string, userId: string): boolean {
    const entry = this.resumes.get(id);
    if (!entry || entry.userId !== userId) {
      return false; // Forbidden or not found
    }

    this.resumes.delete(id);
    this.matrices.delete(id);
    this.rawAnalyses.delete(id);

    if (this.latestUserResume.get(userId) === id) {
      // Find previous resume if any
      const remaining = this.listResumes(userId);
      if (remaining.length > 0) {
        this.latestUserResume.set(userId, remaining[remaining.length - 1].id);
      } else {
        this.latestUserResume.delete(userId);
      }
    }

    // Async DB deletion
    dbService.resumes.deleteOne({ _id: id, userId });
    dbService.skillProfiles.deleteOne({ resumeId: id, userId });

    return true;
  }

  async saveMatrix(matrix: SkillMatrix, userId = "default-user"): Promise<void> {
    this.matrices.set(matrix.resumeId, { matrix, userId });

    const doc: SkillProfileDoc = {
      _id: `skillprof-${matrix.resumeId}`,
      userId,
      resumeId: matrix.resumeId,
      skills: matrix.items.map((i) => i.canonicalName),
      matrix,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existing = await dbService.skillProfiles.findOne({ userId });
    if (existing) {
      await dbService.skillProfiles.updateOne({ userId }, doc);
    } else {
      await dbService.skillProfiles.insertOne(doc);
    }
  }

  getMatrix(resumeId: string, userId?: string): SkillMatrix | undefined {
    const entry = this.matrices.get(resumeId);
    if (!entry) return undefined;

    if (userId && entry.userId !== userId) {
      return undefined;
    }

    return entry.matrix;
  }

  saveAnalysis(resumeId: string, analysis: GeminiResumeAnalysis, userId = "default-user"): void {
    this.rawAnalyses.set(resumeId, { analysis, userId });
  }

  getAnalysis(resumeId: string, userId?: string): GeminiResumeAnalysis | undefined {
    const entry = this.rawAnalyses.get(resumeId);
    if (!entry) return undefined;

    if (userId && entry.userId !== userId) {
      return undefined;
    }

    return entry.analysis;
  }

  clear(): void {
    this.resumes.clear();
    this.matrices.clear();
    this.rawAnalyses.clear();
    this.latestUserResume.clear();
    this.globalLatestResumeId = null;
  }
}

export const resumeRepository = new ResumeRepository();
