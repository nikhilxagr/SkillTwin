import { describe, expect, it } from "vitest";
import {
  resumeExtractionSchema,
  skillMatrixSchema,
  jobExtractionSchema,
  gapAnalysisReportSchema,
  resumeOptimizationReportSchema,
  savedCareerAnalysisSchema,
} from "../index.js";

describe("Contracts Schema Validation Suite", () => {
  it("validates a complete structured resume extraction", () => {
    const validResume = {
      id: "resume-123",
      fileName: "john_doe_resume.pdf",
      fileType: "pdf",
      fileSizeBytes: 204800,
      rawText: "John Doe\nFull Stack Developer\nReact, Node.js, TypeScript...",
      profile: {
        name: "John Doe",
        email: "john@example.com",
        githubUrl: "https://github.com/johndoe",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        summary: "Software Engineer with 3 years building modern web applications.",
        yearsOfExperienceEstimate: 3,
      },
      skillsClaimed: ["JavaScript", "TypeScript", "React", "Node.js", "Docker"],
      projects: [
        {
          name: "DevPlatform",
          role: "Lead Full Stack Developer",
          description: "Developer analytics dashboard",
          technologies: ["React", "TypeScript", "Node.js", "MongoDB"],
          bullets: [
            "Built responsive UI with React and TypeScript.",
            "Architected REST API with Express and Node.js.",
          ],
          githubUrl: "https://github.com/johndoe/devplatform",
        },
      ],
      experience: [
        {
          company: "Tech Corp",
          role: "Software Engineer",
          startDate: "2023-01",
          endDate: "2025-06",
          current: false,
          bullets: ["Maintained React component library and internal microservices."],
          technologies: ["React", "Node.js"],
        },
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "B.S. in Computer Science",
          fieldOfStudy: "Computer Science",
          startDate: "2019",
          endDate: "2023",
        },
      ],
      certifications: [
        {
          name: "AWS Certified Developer",
          issuer: "Amazon Web Services",
          year: "2024",
        },
      ],
      achievements: ["Dean's List 2022"],
      parsedAt: new Date().toISOString(),
    };

    const parsed = resumeExtractionSchema.safeParse(validResume);
    expect(parsed.success).toBe(true);
  });

  it("validates skill matrix schema with confidence calculations and evidence", () => {
    const validMatrix = {
      resumeId: "resume-123",
      items: [
        {
          canonicalName: "React",
          category: "Frontend",
          aliases: ["React.js", "ReactJS"],
          proficiency: "Strong",
          confidence: 84,
          evidenceLevel: "Demonstrated",
          evidence: [
            {
              id: "ev-1",
              sourceType: "project",
              context: "Built responsive UI with React and TypeScript in DevPlatform",
              sourceTitle: "DevPlatform",
              weight: 40,
              verified: true,
            },
            {
              id: "ev-2",
              sourceType: "skills_section",
              context: "Listed in resume skills section",
              weight: 20,
              verified: true,
            },
          ],
          explanation: "Demonstrated in 2 projects with modern hooks and typed state.",
          missingEvidence: ["Automated testing suite", "Server-side rendering"],
          relatedSkills: ["TypeScript", "Next.js"],
          claimed: true,
          demonstrated: true,
        },
      ],
      summary: {
        totalSkills: 1,
        demonstratedCount: 1,
        claimedOnlyCount: 0,
        weakEvidenceCount: 0,
        averageConfidence: 84,
        topSkills: ["React"],
      },
      generatedAt: new Date().toISOString(),
    };

    const parsed = skillMatrixSchema.safeParse(validMatrix);
    expect(parsed.success).toBe(true);
  });

  it("rejects confidence score out of bounds", () => {
    const invalidMatrixItem = {
      canonicalName: "React",
      category: "Frontend",
      aliases: [],
      proficiency: "Strong",
      confidence: 150, // Invalid: exceeds 100
      evidenceLevel: "Demonstrated",
      evidence: [],
      explanation: "Test explanation",
      missingEvidence: [],
      relatedSkills: [],
      claimed: true,
      demonstrated: true,
    };

    const parsed = skillMatrixSchema.safeParse({
      resumeId: "resume-123",
      items: [invalidMatrixItem],
      summary: {
        totalSkills: 1,
        demonstratedCount: 1,
        claimedOnlyCount: 0,
        weakEvidenceCount: 0,
        averageConfidence: 150,
        topSkills: [],
      },
      generatedAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(false);
  });

  it("validates job description extraction schema", () => {
    const validJob = {
      id: "job-456",
      title: "Senior Full Stack Engineer",
      company: "Acme Cloud",
      location: "Remote",
      rawText: "We are seeking a Senior Full Stack Engineer...",
      experience: {
        minYears: 3,
        maxYears: 5,
        level: "Mid",
        description: "3-5 years professional experience",
      },
      education: "Bachelor's degree in CS or equivalent",
      requiredSkills: [
        {
          canonicalName: "TypeScript",
          category: "Languages",
          importance: "Required",
          minimumProficiency: "Strong",
          contextSentence: "Must have deep TypeScript expertise in frontend and backend.",
        },
      ],
      preferredSkills: [
        {
          canonicalName: "Docker",
          category: "Cloud/DevOps",
          importance: "Preferred",
          minimumProficiency: "Intermediate",
          contextSentence: "Experience with containerized deployments is a plus.",
        },
      ],
      responsibilities: ["Design APIs", "Lead architecture reviews"],
      qualifications: ["B.S. in Computer Science"],
      keywords: {
        technicalSkills: ["TypeScript", "Node.js"],
        frameworks: ["React", "Express"],
        tools: ["Git", "Docker"],
        cloud: ["AWS"],
        databases: ["PostgreSQL"],
        softSkills: ["Communication", "Leadership"],
      },
      parsedAt: new Date().toISOString(),
    };

    const parsed = jobExtractionSchema.safeParse(validJob);
    expect(parsed.success).toBe(true);
  });

  it("validates 5-tier gap analysis report schema", () => {
    const validGapReport = {
      id: "gap-789",
      resumeId: "resume-123",
      jobId: "job-456",
      targetRole: "Senior Full Stack Engineer",
      company: "Acme Cloud",
      summary: {
        totalRequired: 4,
        totalPreferred: 2,
        matchCount: 2,
        partialCount: 1,
        criticalGapCount: 1,
        weakEvidenceCount: 0,
        optionalGapCount: 1,
        alignmentRating: "Moderate",
        alignmentScore: 68,
        alignmentExplanation: "Solid frontend match; backend meets mid requirements, Docker is missing.",
      },
      criticalGaps: [
        {
          canonicalName: "Docker",
          category: "Cloud/DevOps",
          status: "GAP",
          importance: "Required",
          candidateProficiency: "Not Detected",
          requiredProficiency: "Intermediate",
          candidateConfidence: 0,
          evidenceCount: 0,
          evidenceSummary: "No Docker mentions or container configurations found.",
          gapRationale: "Containerization is required for cloud deployments.",
          suggestedAction: "Build and deploy a containerized full-stack application before applying.",
        },
      ],
      partialGaps: [],
      weakEvidence: [],
      strongMatches: [
        {
          canonicalName: "TypeScript",
          category: "Languages",
          status: "MATCH",
          importance: "Required",
          candidateProficiency: "Strong",
          requiredProficiency: "Strong",
          candidateConfidence: 85,
          evidenceCount: 3,
          evidenceSummary: "Demonstrated across multiple repositories and commercial experience.",
          gapRationale: "Candidate matches required depth.",
          suggestedAction: "Highlight complex generic types and architecture in interviews.",
        },
      ],
      optionalGaps: [],
      generatedAt: new Date().toISOString(),
    };

    const parsed = gapAnalysisReportSchema.safeParse(validGapReport);
    expect(parsed.success).toBe(true);
  });

  it("validates non-hallucinatory resume optimization report", () => {
    const validOptimization = {
      id: "opt-101",
      resumeId: "resume-123",
      jobId: "job-456",
      bulletImprovements: [
        {
          id: "bullet-1",
          originalBullet: "Built web app with React and Node.",
          improvedBullet:
            "Architected full-stack web application with React components and Node.js REST API integration.",
          targetedSkill: "React",
          rationale: "Highlight specific structural components already verified in your project code.",
          evidenceConfirmed: true,
          truthWarning: "Only use if your project actually implemented REST API contracts.",
        },
      ],
      truthfulRecommendations: [
        {
          id: "rec-1",
          category: "missing_jd_skills",
          title: "Docker containerization not demonstrated",
          description: "The job requires Docker for local dev and deployment.",
          truthCheckNote: "Do not claim Docker on your resume until you have containerized an active project.",
          suggestedAction: "Create a Dockerfile and docker-compose.yml for DevPlatform and verify container networking.",
        },
      ],
      keywordCoverage: [
        {
          keyword: "TypeScript",
          category: "Languages",
          status: "matched",
          evidenceSnippet: "Built responsive UI with React and TypeScript",
        },
        {
          keyword: "Docker",
          category: "Cloud/DevOps",
          status: "missing",
        },
      ],
      truthfulGuidanceRules: [
        "Never fabricate statistics or metrics not measured in production.",
        "Only list technologies you can confidently explain in a technical interview.",
      ],
      generatedAt: new Date().toISOString(),
    };

    const parsed = resumeOptimizationReportSchema.safeParse(validOptimization);
    expect(parsed.success).toBe(true);
  });
});
