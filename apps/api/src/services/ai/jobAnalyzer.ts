import { geminiService, GeminiService } from "./gemini.js";
import {
  geminiJobAnalysisSchema,
  type GeminiJobAnalysis,
} from "./schemas/job-schema.js";
import { DeterministicJobParser } from "../../modules/job/deterministic-job.parser.js";
import type { AIJobExtraction, AIJobSkill } from "../../modules/job/job.schema.js";

export const JOB_ANALYZER_SYSTEM_PROMPT = `
You are the Job Description Intelligence Engine for SkillTwin, a serious developer career intelligence platform.
Your task is to analyze technical developer job descriptions (JDs) and extract all technical requirements and competencies with strict rigor and accuracy.

CRITICAL NON-HALLUCINATION & RIGOROUS PARSING RULES:
1. Extract ONLY facts, requirements, and responsibilities that are explicitly stated in the job description text.
2. DO NOT invent technologies, years of experience, or qualifications that are not present.
3. STRICTLY DISTINGUISH REQUIRED FROM PREFERRED:
   - "Required": Skills, languages, or proficiencies explicitly listed under "Requirements", "Basic Qualifications", "Minimum Requirements", "Must Have", or phrased as mandatory (e.g., "Must have 3+ years of React", "Required: PostgreSQL").
   - "Preferred": Skills or technologies listed under "Preferred", "Nice to Have", "Bonus Points", "Plus", "Desired", or "Ideal candidate will also have".
   - If a technology is mentioned as part of daily core duties or primary tech stack without being explicitly marked preferred, classify it as "Required".
4. EXTRACT AND CATEGORIZE TECHNICAL COMPETENCIES:
   - programmingLanguages (e.g. TypeScript, Python, Go, Java, C++, Rust, C#)
   - frameworks (e.g. React, Next.js, Node.js, Express, Django, FastAPI, Spring Boot)
   - libraries (e.g. Tailwind CSS, Redux, Prisma, SQLAlchemy)
   - databases (e.g. PostgreSQL, MongoDB, Redis, MySQL, DynamoDB)
   - tools (e.g. Git, Linux, Postman, Webpack, Vite)
   - cloud (e.g. AWS, GCP, Azure, Cloudflare)
   - devops (e.g. Docker, Kubernetes, CI/CD, Terraform, GitHub Actions)
   - testing (e.g. Jest, Vitest, Cypress, Playwright, JUnit)
   - security (e.g. OAuth, JWT, OWASP, AppSec, IAM)
   - softSkills (e.g. Agile / Scrum, Code Reviews, Technical Mentorship, Cross-Functional Collaboration)
5. EXPERIENCE & EDUCATION REQUIREMENTS:
   - Identify minimum years, maximum years, seniority level (Entry, Junior, Mid, Senior, Lead, Principal, NotSpecified), and text description.
   - Identify degree, field of study, whether degree is strictly required or equivalent experience accepted.
6. CONTEXT CAPTURE:
   - For every required or preferred skill, extract the verbatim or near-verbatim sentence from the JD as its "contextSentence" and a concise "whyRequired" / "whyPreferred" explanation.
7. Output MUST be valid JSON adhering strictly to the provided JSON schema. No markdown fences.
`.trim();

export function createJobAnalyzerPrompt(
  jobText: string,
  fallbackTitle?: string,
  fallbackCompany?: string
): string {
  return `
Analyze the following technical job description and extract structured requirements adhering strictly to this schema:
{
  "role": string, // Job Title / Position
  "company": string or null,
  "location": string or null,
  "experience": {
    "minYears": number or null,
    "maxYears": number or null,
    "level": "Entry" | "Junior" | "Mid" | "Senior" | "Lead" | "Principal" | "NotSpecified",
    "description": string or null
  },
  "education": {
    "degree": string or null,
    "field": string or null,
    "required": boolean,
    "description": string or null
  },
  "requiredSkills": [
    {
      "name": string,
      "category": string,
      "importance": "Required",
      "minimumProficiency": "Strong" | "Intermediate" | "Beginner" | "Weak",
      "contextSentence": string or null,
      "whyRequired": string or null
    }
  ],
  "preferredSkills": [
    {
      "name": string,
      "category": string,
      "importance": "Preferred",
      "minimumProficiency": "Strong" | "Intermediate" | "Beginner" | "Weak",
      "contextSentence": string or null,
      "whyPreferred": string or null
    }
  ],
  "categorizedSkills": {
    "programmingLanguages": string[],
    "frameworks": string[],
    "libraries": string[],
    "databases": string[],
    "tools": string[],
    "cloud": string[],
    "devops": string[],
    "testing": string[],
    "security": string[],
    "softSkills": string[]
  },
  "responsibilities": string[],
  "qualifications": string[],
  "keywords": string[]
}

HINTS:
- Fallback Title Hint: ${fallbackTitle || "Not specified"}
- Fallback Company Hint: ${fallbackCompany || "Not specified"}

JOB DESCRIPTION TEXT:
"""
${jobText}
"""
`.trim();
}

export class JobAnalyzer {
  constructor(
    private readonly gemini: GeminiService = geminiService,
    private readonly deterministicParser: DeterministicJobParser = new DeterministicJobParser()
  ) {}

  /**
   * Analyzes a normalized Job Description text using Gemini when configured,
   * with automatic fallback to the deterministic parser if offline or API key is absent.
   */
  async analyzeJob(
    jobText: string,
    fallbackTitle?: string,
    fallbackCompany?: string
  ): Promise<AIJobExtraction> {
    if (!jobText || jobText.trim().length === 0) {
      throw new Error("Job description text cannot be empty.");
    }

    // If Gemini is not configured, fall back to deterministic parser directly
    if (!this.gemini.isConfigured()) {
      return this.deterministicParser.parse(jobText, fallbackTitle, fallbackCompany);
    }

    try {
      const userPrompt = createJobAnalyzerPrompt(jobText, fallbackTitle, fallbackCompany);

      const geminiResult = await this.gemini.generateStructuredContent<GeminiJobAnalysis>({
        systemPrompt: JOB_ANALYZER_SYSTEM_PROMPT,
        userPrompt,
        schema: geminiJobAnalysisSchema,
        temperature: 0.1,
      });

      return this.mapGeminiToExtraction(geminiResult, fallbackTitle, fallbackCompany);
    } catch (err: any) {
      console.warn(
        `[JobAnalyzer] Gemini extraction encountered an error: ${err.message}. Falling back to deterministic parser.`
      );
      return this.deterministicParser.parse(jobText, fallbackTitle, fallbackCompany);
    }
  }

  /**
   * Maps GeminiJobAnalysis into the canonical AIJobExtraction format used by job services.
   */
  private mapGeminiToExtraction(
    data: GeminiJobAnalysis,
    fallbackTitle?: string,
    fallbackCompany?: string
  ): AIJobExtraction {
    const requiredSkills: AIJobSkill[] = data.requiredSkills.map((s) => ({
      name: s.name,
      importance: "Required",
      minimumProficiency: s.minimumProficiency,
      contextSentence: s.contextSentence || undefined,
    }));

    const preferredSkills: AIJobSkill[] = data.preferredSkills.map((s) => ({
      name: s.name,
      importance: "Preferred",
      minimumProficiency: s.minimumProficiency,
      contextSentence: s.contextSentence || undefined,
    }));

    // Union of cloud + devops for cloudDevOps field
    const cloudDevOps = Array.from(
      new Set([...data.categorizedSkills.cloud, ...data.categorizedSkills.devops])
    );

    // Union of security for cybersecurity field
    const cybersecurity = Array.from(new Set(data.categorizedSkills.security));

    const educationStr = data.education.description
      ? data.education.description
      : data.education.degree
      ? `${data.education.degree}${data.education.field ? ` in ${data.education.field}` : ""}`
      : undefined;

    return {
      title: data.role || fallbackTitle || "Software Engineer",
      company: data.company || fallbackCompany || undefined,
      location: data.location || undefined,
      experience: {
        minYears: data.experience.minYears ?? undefined,
        maxYears: data.experience.maxYears ?? undefined,
        level: data.experience.level,
        description: data.experience.description || undefined,
      },
      education: educationStr,
      requiredSkills,
      preferredSkills,
      categorizedSkills: {
        programmingLanguages: data.categorizedSkills.programmingLanguages,
        frameworks: data.categorizedSkills.frameworks,
        libraries: data.categorizedSkills.libraries,
        databases: data.categorizedSkills.databases,
        tools: data.categorizedSkills.tools,
        cloud: data.categorizedSkills.cloud,
        devops: data.categorizedSkills.devops,
        cloudDevOps,
        testing: data.categorizedSkills.testing,
        security: data.categorizedSkills.security,
        cybersecurity,
        softSkills: data.categorizedSkills.softSkills,
      },
      responsibilities: data.responsibilities,
      qualifications: data.qualifications,
      keywords: data.keywords,
    };
  }
}

export const jobAnalyzer = new JobAnalyzer();
