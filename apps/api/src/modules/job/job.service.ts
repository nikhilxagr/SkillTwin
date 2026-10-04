import crypto from "node:crypto";
import {
  jobExtractionSchema,
  jobAnalysisSchema,
  type JobExtraction,
  type JobAnalysis,
  type JobSkillRequirement,
  type SkillCategory,
} from "@skilltwin/contracts";
import { documentService, type ExtractedDocument } from "../document/document.service.js";
import { activeAIProvider } from "../../providers/ai-factory.js";
import { skillNormalizer, skillRegistry } from "../skills/index.js";
import { jobRepository } from "./job.repository.js";

export interface JobProcessingResult {
  job: JobExtraction;
  analysis: JobAnalysis;
}

export class JobService {
  /**
   * Process JD from file buffer (PDF or TXT)
   */
  async processJobFile(
    fileName: string,
    buffer: Buffer,
    mimeType?: string,
    fallbackTitle?: string,
    fallbackCompany?: string
  ): Promise<JobProcessingResult> {
    const doc = await documentService.processFile(fileName, buffer, mimeType);
    return this.executePipeline(doc, fallbackTitle, fallbackCompany);
  }

  /**
   * Process JD from direct text
   */
  async processJobText(
    title: string,
    company: string,
    text: string
  ): Promise<JobProcessingResult> {
    const doc = documentService.processText(
      title ? `${title.replace(/\s+/g, "_")}_JD.txt` : "Target_JD.txt",
      text
    );
    return this.executePipeline(doc, title, company);
  }

  private async executePipeline(
    doc: ExtractedDocument,
    fallbackTitle?: string,
    fallbackCompany?: string
  ): Promise<JobProcessingResult> {
    // 1. Run AI extraction with strict validation
    const aiData = await activeAIProvider.extractJob(
      doc.normalizedText,
      fallbackTitle,
      fallbackCompany
    );

    const jobId = `jd-${crypto.randomUUID()}`;

    // 2. Normalize and Deduplicate Required Skills using the Skill Engine
    const requiredSkillsMap = new Map<string, JobSkillRequirement>();

    for (const req of aiData.requiredSkills) {
      const match = skillNormalizer.normalizeSkill(req.name);
      const canonicalName = match ? match.canonicalName : req.name.trim();
      const category: SkillCategory = match ? match.category : skillRegistry.inferCategory(canonicalName);

      if (!requiredSkillsMap.has(canonicalName.toLowerCase())) {
        requiredSkillsMap.set(canonicalName.toLowerCase(), {
          canonicalName,
          category,
          importance: "Required",
          minimumProficiency: req.minimumProficiency || "Intermediate",
          contextSentence: req.contextSentence || `Required technical competency: ${canonicalName}`,
        });
      }
    }

    // 3. Normalize and Deduplicate Preferred Skills using the Skill Engine
    const preferredSkillsMap = new Map<string, JobSkillRequirement>();

    for (const pref of aiData.preferredSkills) {
      const match = skillNormalizer.normalizeSkill(pref.name);
      const canonicalName = match ? match.canonicalName : pref.name.trim();
      const category: SkillCategory = match ? match.category : skillRegistry.inferCategory(canonicalName);

      // If already captured under Required, Required takes precedence
      if (requiredSkillsMap.has(canonicalName.toLowerCase())) {
        continue;
      }

      if (!preferredSkillsMap.has(canonicalName.toLowerCase())) {
        preferredSkillsMap.set(canonicalName.toLowerCase(), {
          canonicalName,
          category,
          importance: "Preferred",
          minimumProficiency: pref.minimumProficiency || "Intermediate",
          contextSentence: pref.contextSentence || `Preferred technical skill: ${canonicalName}`,
        });
      }
    }

    const requiredSkills = Array.from(requiredSkillsMap.values());
    const preferredSkills = Array.from(preferredSkillsMap.values());

    // 4. Normalize Keywords per Category
    const normLanguages = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.programmingLanguages).matches.map((m) => m.canonicalName);
    const normFrameworks = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.frameworks).matches.map((m) => m.canonicalName);
    const normLibraries = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.libraries).matches.map((m) => m.canonicalName);
    const normDatabases = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.databases).matches.map((m) => m.canonicalName);
    const normTools = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.tools).matches.map((m) => m.canonicalName);
    const normCloud = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.cloudDevOps).matches.map((m) => m.canonicalName);
    const normSecurity = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.cybersecurity).matches.map((m) => m.canonicalName);

    const keywords = {
      programmingLanguages: normLanguages.length > 0 ? normLanguages : ["TypeScript", "JavaScript"],
      frameworks: normFrameworks.length > 0 ? normFrameworks : ["React", "Node.js"],
      libraries: normLibraries,
      databases: normDatabases.length > 0 ? normDatabases : ["PostgreSQL"],
      tools: normTools.length > 0 ? normTools : ["Git"],
      cloudDevOps: normCloud.length > 0 ? normCloud : ["Docker"],
      cybersecurity: normSecurity,
      softSkills: aiData.categorizedSkills.softSkills.length > 0 ? aiData.categorizedSkills.softSkills : ["Agile / Scrum", "Code Reviews"],
      generalKeywords: aiData.keywords,
      technicalSkills: Array.from(new Set([...normLanguages, ...normFrameworks, ...normDatabases])),
      cloud: normCloud,
    };

    // 5. Build validated JobExtraction
    const jobData: JobExtraction = {
      id: jobId,
      title: aiData.title || fallbackTitle || "Senior Full-Stack Engineer",
      company: aiData.company || fallbackCompany,
      location: aiData.location,
      rawText: doc.rawText,
      experience: {
        minYears: aiData.experience.minYears,
        maxYears: aiData.experience.maxYears,
        level: aiData.experience.level || "NotSpecified",
        description: aiData.experience.description,
      },
      education: aiData.education,
      requiredSkills,
      preferredSkills,
      responsibilities: aiData.responsibilities,
      qualifications: aiData.qualifications,
      keywords,
      parsedAt: new Date().toISOString(),
    };

    const validatedJob = jobExtractionSchema.parse(jobData);

    // 6. Build JobAnalysis summary
    const categoryCount = new Map<SkillCategory, number>();
    [...requiredSkills, ...preferredSkills].forEach((s) => {
      categoryCount.set(s.category, (categoryCount.get(s.category) || 0) + 1);
    });

    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 4);

    const analysisData: JobAnalysis = {
      id: `analysis-${jobId}`,
      job: validatedJob,
      summary: {
        roleTitle: validatedJob.title,
        company: validatedJob.company,
        totalRequiredSkills: requiredSkills.length,
        totalPreferredSkills: preferredSkills.length,
        experienceLevel: validatedJob.experience.level,
        minYearsExperience: validatedJob.experience.minYears,
        topCategories,
      },
      analyzedAt: new Date().toISOString(),
    };

    const validatedAnalysis = jobAnalysisSchema.parse(analysisData);

    // 7. Persist in repository
    jobRepository.saveJob(validatedJob);
    jobRepository.saveAnalysis(validatedAnalysis);

    return {
      job: validatedJob,
      analysis: validatedAnalysis,
    };
  }

  getJob(id: string): JobExtraction | undefined {
    return jobRepository.getJob(id);
  }

  getAnalysis(id: string): JobAnalysis | undefined {
    return jobRepository.getAnalysis(id);
  }

  getLatestJob(): JobExtraction | undefined {
    return jobRepository.getLatestJob();
  }
}

export const jobService = new JobService();
