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
import { jobAnalyzer } from "../../services/ai/jobAnalyzer.js";
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
    fallbackCompany?: string,
    userId = "default-user"
  ): Promise<JobProcessingResult> {
    const doc = await documentService.processFile(fileName, buffer, mimeType);
    return this.executePipeline(doc, fallbackTitle, fallbackCompany, userId);
  }

  /**
   * Process JD from direct text
   */
  async processJobText(
    title: string,
    company: string,
    text: string,
    userId = "default-user"
  ): Promise<JobProcessingResult> {
    const doc = documentService.processText(
      title ? `${title.replace(/\s+/g, "_")}_JD.txt` : "Target_JD.txt",
      text
    );
    return this.executePipeline(doc, title, company, userId);
  }

  private async executePipeline(
    doc: ExtractedDocument,
    fallbackTitle?: string,
    fallbackCompany?: string,
    userId = "default-user"
  ): Promise<JobProcessingResult> {
    // 1. Run AI extraction with strict validation using Gemini (with deterministic fallback)
    const aiData = await jobAnalyzer.analyzeJob(
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

    // 4. Normalize Keywords per Category using the Skill Engine
    const normLanguages = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.programmingLanguages).matches.map((m) => m.canonicalName);
    const normFrameworks = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.frameworks).matches.map((m) => m.canonicalName);
    const normLibraries = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.libraries).matches.map((m) => m.canonicalName);
    const normDatabases = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.databases).matches.map((m) => m.canonicalName);
    const normTools = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.tools).matches.map((m) => m.canonicalName);

    const rawCloudDevOps = [
      ...aiData.categorizedSkills.cloudDevOps,
      ...(aiData.categorizedSkills.cloud || []),
      ...(aiData.categorizedSkills.devops || []),
      ...requiredSkills
        .filter((s) => s.category === "Cloud/DevOps" || s.category === "DevOps" || s.category === "Cloud")
        .map((s) => s.canonicalName),
      ...preferredSkills
        .filter((s) => s.category === "Cloud/DevOps" || s.category === "DevOps" || s.category === "Cloud")
        .map((s) => s.canonicalName),
    ];
    const normCloud = Array.from(new Set(skillNormalizer.normalizeSkillList(rawCloudDevOps).matches.map((m) => m.canonicalName)));

    const rawSecurity = [
      ...aiData.categorizedSkills.cybersecurity,
      ...(aiData.categorizedSkills.security || []),
    ];
    const normSecurity = skillNormalizer.normalizeSkillList(rawSecurity).matches.map((m) => m.canonicalName);
    const normTesting = skillNormalizer.normalizeSkillList(aiData.categorizedSkills.testing || []).matches.map((m) => m.canonicalName);

    const keywords = {
      programmingLanguages: normLanguages.length > 0 ? normLanguages : ["TypeScript", "JavaScript"],
      frameworks: normFrameworks.length > 0 ? normFrameworks : ["React", "Node.js"],
      libraries: normLibraries,
      databases: normDatabases.length > 0 ? normDatabases : ["PostgreSQL"],
      tools: normTools.length > 0 ? normTools : ["Git"],
      cloud: normCloud,
      devops: normCloud,
      cloudDevOps: normCloud.length > 0 ? normCloud : ["Docker"],
      testing: normTesting,
      security: normSecurity,
      cybersecurity: normSecurity,
      softSkills: aiData.categorizedSkills.softSkills.length > 0 ? aiData.categorizedSkills.softSkills : ["Agile / Scrum", "Code Reviews"],
      generalKeywords: aiData.keywords,
      technicalSkills: Array.from(new Set([...normLanguages, ...normFrameworks, ...normDatabases])),
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
    await jobRepository.saveJob(validatedJob, userId);
    await jobRepository.saveAnalysis(validatedAnalysis, userId);

    return {
      job: validatedJob,
      analysis: validatedAnalysis,
    };
  }

  getJob(id: string, userId?: string): JobExtraction | undefined {
    return jobRepository.getJob(id, userId);
  }

  getAnalysis(id: string, userId?: string): JobAnalysis | undefined {
    return jobRepository.getAnalysis(id, userId);
  }

  getLatestJob(userId?: string): JobExtraction | undefined {
    return jobRepository.getLatestJob(userId);
  }

  listJobs(userId?: string): JobExtraction[] {
    return jobRepository.listJobs(userId);
  }

  deleteJob(id: string, userId: string): boolean {
    return jobRepository.deleteJob(id, userId);
  }
}

export const jobService = new JobService();
