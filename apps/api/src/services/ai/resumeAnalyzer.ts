import { geminiService } from "./gemini.js";
import {
  geminiResumeAnalysisSchema,
  type GeminiResumeAnalysis,
  type GeminiSkillEvidence,
} from "./schemas/resume-schema.js";
import { deterministicAIProvider } from "../../providers/deterministic-ai.provider.js";
import type { AIResumeExtraction } from "../../providers/ai-response.schema.js";

export const RESUME_ANALYZER_SYSTEM_PROMPT = `
You are the Resume Intelligence Engine for SkillTwin, a serious developer career intelligence platform.
Your objective is to accurately and strictly extract structured career entities from technical developer resumes.

CRITICAL NON-HALLUCINATION & EVIDENCE RULES:
1. Extract ONLY facts, skills, and projects that are explicitly stated in the resume text.
2. DO NOT invent metrics, percentage improvements, team sizes, dates, or technologies that do not appear in the text.
3. Categorize technical skills strictly into:
   - programmingLanguages
   - frameworks
   - libraries
   - databases
   - tools
   - cloudTechnologies
   - devopsTechnologies
   - cybersecurityTechnologies
   - softSkills
   - otherTechnical
4. For every extracted skill, evaluate and generate grounded skill evidence:
   - canonicalName: Standardized canonical technology name (e.g., "React", "Docker", "PostgreSQL", "TypeScript").
   - category: Appropriate category.
   - confidence: Numeric score between 0.0 and 1.0 (e.g., 0.84 for strong multi-source evidence, 0.40 for claimed-only in a comma list).
   - proficiency: "Strong" | "Intermediate" | "Basic" | "Not Demonstrated".
     * DO NOT assign "Strong" merely because a skill appears once in a skills list.
     * "Strong" requires multiple corroborating bullets with actual implementation details.
     * "Basic" or "Intermediate" if only listed in a skills section or mentioned in passing.
   - evidence: Array of factual corroborating sentences from the resume (e.g., "Listed in skills section", "Used in Project X for UI rendering").
   - source: Summary of where found (e.g., "Projects & Work Experience", "Skills Section", "Education").
   - missingEvidence: Array of missing corroborations (e.g., "Automated testing not demonstrated", "Production metrics not provided").
5. Output MUST be valid JSON adhering strictly to the provided JSON schema. No markdown fences.
`.trim();

export function createResumeAnalyzerPrompt(resumeText: string): string {
  return `
Analyze the following developer resume and return structured career entities adhering strictly to this schema:
{
  "profile": {
    "name": string or null,
    "summary": string or null,
    "email": string or null,
    "phone": string or null,
    "location": string or null,
    "githubUrl": string or null,
    "linkedinUrl": string or null,
    "portfolioUrl": string or null,
    "yearsOfExperienceEstimate": number or null
  },
  "categorizedSkills": {
    "programmingLanguages": string[],
    "frameworks": string[],
    "libraries": string[],
    "databases": string[],
    "tools": string[],
    "cloudTechnologies": string[],
    "devopsTechnologies": string[],
    "cybersecurityTechnologies": string[],
    "softSkills": string[],
    "otherTechnical": string[]
  },
  "skillEvidence": [
    {
      "canonicalName": string,
      "category": string,
      "confidence": number between 0 and 1,
      "proficiency": "Strong" | "Intermediate" | "Basic" | "Not Demonstrated",
      "evidence": string[],
      "source": string,
      "missingEvidence": string[]
    }
  ],
  "projects": [
    {
      "name": string,
      "role": string or null,
      "description": string or null,
      "technologies": string[],
      "bullets": string[],
      "githubUrl": string or null,
      "liveUrl": string or null
    }
  ],
  "experience": [
    {
      "company": string,
      "role": string,
      "location": string or null,
      "startDate": string or null,
      "endDate": string or null,
      "current": boolean,
      "bullets": string[],
      "technologies": string[]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "fieldOfStudy": string or null,
      "startDate": string or null,
      "endDate": string or null,
      "gpa": string or null
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string or null,
      "year": string or null
    }
  ],
  "achievements": string[]
}

RESUME TEXT:
"""
${resumeText}
"""
`.trim();
}

export class ResumeAnalyzer {
  /**
   * Primary entry point: Extracts structured resume entities using Gemini API.
   * If Gemini API key is missing or call fails, gracefully uses the deterministic offline engine.
   */
  async analyzeResume(normalizedText: string): Promise<GeminiResumeAnalysis> {
    if (geminiService.isConfigured()) {
      try {
        const result = await geminiService.generateStructuredContent<GeminiResumeAnalysis>({
          systemPrompt: RESUME_ANALYZER_SYSTEM_PROMPT,
          userPrompt: createResumeAnalyzerPrompt(normalizedText),
          schema: geminiResumeAnalysisSchema,
        });

        // Ensure skillEvidence is populated; if empty, synthesize from extracted categories and projects
        if (!result.skillEvidence || result.skillEvidence.length === 0) {
          result.skillEvidence = this.synthesizeSkillEvidence(result);
        }

        return result;
      } catch (err: any) {
        console.warn(
          `[ResumeAnalyzer] Gemini extraction error (${err.message}). Using deterministic fallback engine.`
        );
        return await this.fallbackAnalysis(normalizedText);
      }
    }

    return await this.fallbackAnalysis(normalizedText);
  }

  /**
   * Deterministic fallback when Gemini API key is not configured or network call fails.
   */
  private async fallbackAnalysis(normalizedText: string): Promise<GeminiResumeAnalysis> {
    const raw = await deterministicAIProvider.extractResume(normalizedText);

    const fallbackSkills = {
      programmingLanguages: raw.categorizedSkills.programmingLanguages || [],
      frameworks: raw.categorizedSkills.frameworks || [],
      libraries: raw.categorizedSkills.libraries || [],
      databases: raw.categorizedSkills.databases || [],
      tools: raw.categorizedSkills.tools || [],
      cloudTechnologies: raw.categorizedSkills.cloudDevOps || [],
      devopsTechnologies: raw.categorizedSkills.cloudDevOps || [],
      cybersecurityTechnologies: raw.categorizedSkills.cybersecurity || [],
      softSkills: raw.categorizedSkills.softSkills || [],
      otherTechnical: raw.categorizedSkills.otherTechnical || [],
    };

    const analysis: GeminiResumeAnalysis = {
      profile: {
        name: raw.profile.name,
        summary: raw.profile.summary,
        email: raw.profile.email,
        phone: raw.profile.phone,
        location: raw.profile.location,
        githubUrl: raw.profile.githubUrl,
        linkedinUrl: raw.profile.linkedinUrl,
        portfolioUrl: raw.profile.portfolioUrl,
        yearsOfExperienceEstimate: raw.profile.yearsOfExperienceEstimate,
      },
      categorizedSkills: fallbackSkills,
      skillEvidence: [],
      projects: raw.projects.map((p) => ({
        name: p.name,
        role: p.role,
        description: p.description,
        technologies: p.technologies,
        bullets: p.bullets,
        githubUrl: p.githubUrl,
        liveUrl: p.liveUrl,
      })),
      experience: raw.experience.map((e) => ({
        company: e.company,
        role: e.role,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        bullets: e.bullets,
        technologies: e.technologies,
      })),
      education: raw.education.map((ed) => ({
        institution: ed.institution,
        degree: ed.degree,
        fieldOfStudy: ed.fieldOfStudy,
        startDate: ed.startDate,
        endDate: ed.endDate,
        gpa: ed.gpa,
      })),
      certifications: raw.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        year: c.year,
      })),
      achievements: raw.achievements,
    };

    analysis.skillEvidence = this.synthesizeSkillEvidence(analysis);
    return analysis;
  }

  /**
   * Helper to synthesize granular skill evidence if not directly returned.
   */
  private synthesizeSkillEvidence(analysis: GeminiResumeAnalysis): GeminiSkillEvidence[] {
    const evidenceList: GeminiSkillEvidence[] = [];

    const categoryMap: Array<{ key: keyof typeof analysis.categorizedSkills; label: string }> = [
      { key: "programmingLanguages", label: "Languages" },
      { key: "frameworks", label: "Frontend" },
      { key: "libraries", label: "Frontend" },
      { key: "databases", label: "Databases" },
      { key: "tools", label: "Tools" },
      { key: "cloudTechnologies", label: "Cloud/DevOps" },
      { key: "devopsTechnologies", label: "Cloud/DevOps" },
      { key: "cybersecurityTechnologies", label: "Security" },
      { key: "softSkills", label: "Soft Skills" },
    ];

    for (const { key, label } of categoryMap) {
      const skills = analysis.categorizedSkills[key] || [];
      for (const skill of skills) {
        // Correlate with projects
        const projMatches = analysis.projects.filter(
          (p) =>
            p.technologies.some((t) => t.toLowerCase() === skill.toLowerCase()) ||
            p.bullets.some((b) => b.toLowerCase().includes(skill.toLowerCase()))
        );

        // Correlate with experience
        const expMatches = analysis.experience.filter(
          (e) =>
            e.technologies.some((t) => t.toLowerCase() === skill.toLowerCase()) ||
            e.bullets.some((b) => b.toLowerCase().includes(skill.toLowerCase()))
        );

        const evidence: string[] = ["Explicitly listed in resume skills section"];
        if (projMatches.length > 0) {
          evidence.push(`Implemented in project: ${projMatches.map((p) => p.name).join(", ")}`);
        }
        if (expMatches.length > 0) {
          evidence.push(`Commercial application at: ${expMatches.map((e) => e.company).join(", ")}`);
        }

        const missingEvidence: string[] = [];
        let confidence = 0.45;
        let proficiency: "Strong" | "Intermediate" | "Basic" = "Basic";

        if (projMatches.length > 0 && expMatches.length > 0) {
          confidence = 0.88;
          proficiency = "Strong";
        } else if (projMatches.length > 0 || expMatches.length > 0) {
          confidence = 0.65;
          proficiency = "Intermediate";
          missingEvidence.push("Production deployment at commercial scale not demonstrated");
        } else {
          missingEvidence.push("No project or commercial work evidence found corroborating this skill claim");
        }

        evidenceList.push({
          canonicalName: skill,
          category: label,
          confidence,
          proficiency,
          evidence,
          source: projMatches.length > 0 || expMatches.length > 0 ? "Projects & Experience" : "Skills Section Only",
          missingEvidence,
        });
      }
    }

    return evidenceList;
  }

  /**
   * Converts GeminiResumeAnalysis to AIResumeExtraction for downstream Skill Engine compatibility.
   */
  toAIResumeExtraction(analysis: GeminiResumeAnalysis): AIResumeExtraction {
    return {
      profile: {
        name: analysis.profile.name || undefined,
        summary: analysis.profile.summary || undefined,
        email: analysis.profile.email || undefined,
        phone: analysis.profile.phone || undefined,
        location: analysis.profile.location || undefined,
        githubUrl: analysis.profile.githubUrl || undefined,
        linkedinUrl: analysis.profile.linkedinUrl || undefined,
        portfolioUrl: analysis.profile.portfolioUrl || undefined,
        yearsOfExperienceEstimate: analysis.profile.yearsOfExperienceEstimate || undefined,
      },
      categorizedSkills: {
        programmingLanguages: analysis.categorizedSkills.programmingLanguages,
        frameworks: analysis.categorizedSkills.frameworks,
        libraries: analysis.categorizedSkills.libraries,
        databases: analysis.categorizedSkills.databases,
        tools: analysis.categorizedSkills.tools,
        cloudDevOps: [
          ...analysis.categorizedSkills.cloudTechnologies,
          ...analysis.categorizedSkills.devopsTechnologies,
        ],
        cybersecurity: analysis.categorizedSkills.cybersecurityTechnologies,
        softSkills: analysis.categorizedSkills.softSkills,
        otherTechnical: analysis.categorizedSkills.otherTechnical,
      },
      projects: analysis.projects.map((p) => ({
        name: p.name,
        role: p.role || undefined,
        description: p.description || undefined,
        technologies: p.technologies,
        bullets: p.bullets,
        githubUrl: p.githubUrl || undefined,
        liveUrl: p.liveUrl || undefined,
      })),
      experience: analysis.experience.map((e) => ({
        company: e.company,
        role: e.role,
        location: e.location || undefined,
        startDate: e.startDate || undefined,
        endDate: e.endDate || undefined,
        current: e.current,
        bullets: e.bullets,
        technologies: e.technologies,
      })),
      education: analysis.education.map((ed) => ({
        institution: ed.institution,
        degree: ed.degree,
        fieldOfStudy: ed.fieldOfStudy || undefined,
        startDate: ed.startDate || undefined,
        endDate: ed.endDate || undefined,
        gpa: ed.gpa || undefined,
      })),
      certifications: analysis.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer || undefined,
        year: c.year || undefined,
      })),
      achievements: analysis.achievements,
    };
  }
}

export const resumeAnalyzer = new ResumeAnalyzer();
