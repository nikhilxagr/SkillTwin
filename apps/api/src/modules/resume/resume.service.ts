import crypto from "node:crypto";
import {
  resumeExtractionSchema,
  type ResumeExtraction,
  type SkillMatrix,
} from "@skilltwin/contracts";
import { documentService, type ExtractedDocument } from "../document/document.service.js";
import { resumeAnalyzer, type GeminiResumeAnalysis } from "../../services/ai/index.js";
import { skillNormalizer } from "../skills/index.js";
import { skillMatrixService } from "../skills/skill-matrix.service.js";
import { resumeRepository } from "./resume.repository.js";

export interface ResumeProcessingResult {
  resume: ResumeExtraction;
  matrix: SkillMatrix;
  analysis?: GeminiResumeAnalysis;
}

export class ResumeService {
  /**
   * Complete pipeline: File buffer -> Validation -> Extract text -> Gemini AI parsing -> Skill Matrix -> Persist
   */
  async processResumeFile(
    fileName: string,
    buffer: Buffer,
    mimeType?: string
  ): Promise<ResumeProcessingResult> {
    const doc = await documentService.processFile(fileName, buffer, mimeType);
    return this.executePipeline(doc);
  }

  /**
   * Complete pipeline: Raw text -> Validation -> Normalize -> Gemini AI parsing -> Skill Matrix -> Persist
   */
  async processResumeText(fileName: string, text: string): Promise<ResumeProcessingResult> {
    const doc = documentService.processText(fileName, text);
    return this.executePipeline(doc);
  }

  private async executePipeline(doc: ExtractedDocument): Promise<ResumeProcessingResult> {
    // 1. Send structured content to Gemini with strict schema validation
    const geminiAnalysis = await resumeAnalyzer.analyzeResume(doc.normalizedText);
    const aiData = resumeAnalyzer.toAIResumeExtraction(geminiAnalysis);

    // 2. Assemble and normalize claimed skills using the Skill Engine
    const rawClaimed: string[] = [];
    Object.values(aiData.categorizedSkills).forEach((skills) => {
      skills.forEach((s) => {
        if (!rawClaimed.includes(s)) rawClaimed.push(s);
      });
    });

    const norm = skillNormalizer.normalizeSkillList(rawClaimed);
    const claimedSkills = norm.matches.map((m: { canonicalName: string }) => m.canonicalName);
    norm.unmatchedTokens.forEach((token: string) => {
      if (!claimedSkills.includes(token)) claimedSkills.push(token);
    });

    const resumeId = `resume-${crypto.randomUUID()}`;

    // 3. Build ResumeExtraction conforming to contracts
    const resumeData: ResumeExtraction = {
      id: resumeId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      rawText: doc.rawText,
      profile: {
        name: aiData.profile.name,
        email: aiData.profile.email,
        phone: aiData.profile.phone,
        location: aiData.profile.location,
        githubUrl: aiData.profile.githubUrl,
        linkedinUrl: aiData.profile.linkedinUrl,
        portfolioUrl: aiData.profile.portfolioUrl,
        summary: aiData.profile.summary,
        yearsOfExperienceEstimate: aiData.profile.yearsOfExperienceEstimate,
      },
      skillsClaimed: claimedSkills,
      projects: aiData.projects,
      experience: aiData.experience,
      education: aiData.education,
      certifications: aiData.certifications,
      achievements: aiData.achievements,
      parsedAt: new Date().toISOString(),
    };

    const validatedResume = resumeExtractionSchema.parse(resumeData);

    // 4. Generate Skill Matrix with granular evidence
    const matrix = skillMatrixService.generateMatrix(resumeId, aiData, claimedSkills);

    // 5. Store in repository
    resumeRepository.saveResume(validatedResume);
    resumeRepository.saveMatrix(matrix);
    resumeRepository.saveAnalysis(resumeId, geminiAnalysis);

    return {
      resume: validatedResume,
      matrix,
      analysis: geminiAnalysis,
    };
  }

  getResume(id: string): ResumeExtraction | undefined {
    return resumeRepository.getResume(id);
  }

  getLatestResume(): ResumeExtraction | undefined {
    return resumeRepository.getLatestResume();
  }

  getMatrix(resumeId: string): SkillMatrix | undefined {
    return resumeRepository.getMatrix(resumeId);
  }

  getAnalysis(resumeId: string): GeminiResumeAnalysis | undefined {
    return resumeRepository.getAnalysis(resumeId);
  }
}

export const resumeService = new ResumeService();
