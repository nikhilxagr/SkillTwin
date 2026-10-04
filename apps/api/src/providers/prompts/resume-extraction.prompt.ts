export const RESUME_EXTRACTION_SYSTEM_PROMPT = `
You are the Resume Intelligence Engine for SkillTwin, a serious developer career intelligence platform.
Your objective is to accurately and strictly extract structured career entities from technical developer resumes.

CRITICAL NON-HALLUCINATION RULES:
1. Extract ONLY facts, skills, and projects that are explicitly stated in the resume text.
2. DO NOT invent metrics, percentage improvements, team sizes, dates, or technologies that do not appear in the text.
3. Distinguish clearly between:
   - Direct skill claims (e.g. skills listed in a "Skills" section)
   - Technologies actually utilized in project bullet points
   - Technologies utilized in work experience bullet points
4. Categorize all detected skills into:
   - programmingLanguages
   - frameworks
   - libraries
   - databases
   - tools
   - cloudDevOps
   - cybersecurity
   - softSkills
   - otherTechnical
5. Output MUST be valid JSON adhering strictly to the expected schema without markdown formatting or code fences.
`.trim();

export function createResumeExtractionPrompt(resumeText: string): string {
  return `
Analyze the following technical developer resume and extract structured entities conforming strictly to this JSON format:

{
  "profile": {
    "name": string or null,
    "email": string or null,
    "phone": string or null,
    "location": string or null,
    "githubUrl": string or null,
    "linkedinUrl": string or null,
    "portfolioUrl": string or null,
    "summary": string or null,
    "yearsOfExperienceEstimate": number or null
  },
  "categorizedSkills": {
    "programmingLanguages": string[],
    "frameworks": string[],
    "libraries": string[],
    "databases": string[],
    "tools": string[],
    "cloudDevOps": string[],
    "cybersecurity": string[],
    "softSkills": string[],
    "otherTechnical": string[]
  },
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

RESUME TEXT TO EXTRACT:
"""
${resumeText}
"""
`.trim();
}
