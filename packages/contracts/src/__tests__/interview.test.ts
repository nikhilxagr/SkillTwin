import { describe, it, expect } from "vitest";
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateFinalInterviewReport,
} from "../interview-engine.js";
import {
  simulatorQuestionSchema,
  simulatorAnswerEvaluationSchema,
  simulatorFinalReportSchema,
  type SimulatorExchange,
} from "../interview.js";
import type { ResumeExtraction } from "../resume.js";
import type { SkillMatrix } from "../skills.js";
import type { JobExtraction } from "../job.js";
import type { GapAnalysisReport } from "../gap.js";

const sampleResume: ResumeExtraction = {
  id: "resume-test-1",
  fileName: "test_resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 1024,
  rawText: "Senior Full Stack Engineer with React, TypeScript, and Node.js experience.",
  profile: {
    name: "Alex Morgan",
    summary: "Senior software engineer with 5+ years of experience building high-scale cloud platforms.",
  },
  skillsClaimed: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  projects: [
    {
      name: "DevPlatform SaaS",
      description: "Cloud-native developer portal serving 50k monthly active users.",
      technologies: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      bullets: [
        "Architected distributed event bus with latency under 50ms",
        "Optimized database queries reducing p99 latency by 35%",
      ],
    },
  ],
  experience: [],
  education: [],
  certifications: [],
  achievements: [],
  parsedAt: new Date().toISOString(),
};

const sampleMatrix: SkillMatrix = {
  resumeId: "resume-test-1",
  items: [
    {
      canonicalName: "TypeScript",
      category: "Programming Languages",
      aliases: ["ts"],
      proficiency: "Strong",
      confidence: 90,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-1",
          sourceType: "project",
          context: "Architected distributed event bus in TypeScript",
          weight: 85,
          verified: true,
        },
      ],
      explanation: "Demonstrated in DevPlatform SaaS project.",
      missingEvidence: [],
      relatedSkills: ["JavaScript", "Node.js"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "React",
      category: "Frameworks & Libraries",
      aliases: ["reactjs"],
      proficiency: "Strong",
      confidence: 88,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-2",
          sourceType: "project",
          context: "Built interactive dashboards in React",
          weight: 85,
          verified: true,
        },
      ],
      explanation: "Demonstrated in production frontend.",
      missingEvidence: [],
      relatedSkills: ["TypeScript", "Next.js"],
      claimed: true,
      demonstrated: true,
    },
  ],
  summary: {
    totalSkills: 2,
    demonstratedCount: 2,
    claimedOnlyCount: 0,
    weakEvidenceCount: 0,
    averageConfidence: 89,
    topSkills: ["TypeScript", "React"],
  },
  generatedAt: new Date().toISOString(),
};


const sampleJob: JobExtraction = {
  id: "job-test-1",
  title: "Senior Full-Stack Engineer",
  company: "FinTech Global",
  location: "New York, NY",
  rawText: "Seeking a Senior Full-Stack Engineer with React, TypeScript, Docker, and distributed systems experience.",
  experience: {
    level: "Senior",
    minYears: 5,
  },
  requiredSkills: [
    {
      canonicalName: "TypeScript",
      category: "Programming Languages",
      importance: "Required",
      minimumProficiency: "Strong",
    },
    {
      canonicalName: "Docker",
      category: "DevOps & Cloud",
      importance: "Required",
      minimumProficiency: "Intermediate",
    },
  ],
  preferredSkills: [
    {
      canonicalName: "Kubernetes",
      category: "DevOps & Cloud",
      importance: "Preferred",
      minimumProficiency: "Intermediate",
    },
  ],
  responsibilities: ["Build fault-tolerant payment APIs", "Mentor junior engineers"],
  qualifications: ["5+ years experience in TypeScript"],
  keywords: {
    programmingLanguages: ["TypeScript"],
    frameworks: ["React"],
    libraries: [],
    databases: ["PostgreSQL"],
    tools: ["Docker"],
    cloudDevOps: ["Docker", "Kubernetes"],
    cybersecurity: [],
    softSkills: ["Mentorship"],
    generalKeywords: [],
    technicalSkills: ["TypeScript", "Docker"],
  },
  parsedAt: new Date().toISOString(),
};

const sampleGapReport: GapAnalysisReport = {
  id: "gap-test-1",
  resumeId: "resume-test-1",
  jobId: "job-test-1",
  targetRole: "Senior Full-Stack Engineer",
  company: "FinTech Global",
  summary: {
    totalRequired: 2,
    totalPreferred: 1,
    matchCount: 1,
    partialCount: 0,
    criticalGapCount: 1,
    weakEvidenceCount: 0,
    optionalGapCount: 0,
    alignmentRating: "Moderate",
    alignmentScore: 72,
    alignmentExplanation: "Strong match in TypeScript but critical gap in Docker.",
  },
  criticalGaps: [
    {
      canonicalName: "Docker",
      category: "DevOps & Cloud",
      status: "GAP",
      importance: "Required",
      candidateProficiency: "Not Detected",
      requiredProficiency: "Intermediate",
      candidateConfidence: 0,
      evidenceCount: 0,
      evidenceSummary: "No Docker containerization evidence found in resume.",
      gapRationale: "Core requirement for container deployment in target role.",
      suggestedAction: "Build and containerize a project using Docker and docker-compose.",
      priority: "Critical",
      priorityScore: 90,
      priorityRationale: "Mandatory required skill missing from profile.",
      relatedCandidateSkills: [],
    },
  ],
  partialGaps: [],
  weakEvidence: [],
  strongMatches: [
    {
      canonicalName: "TypeScript",
      category: "Programming Languages",
      status: "MATCH",
      importance: "Required",
      candidateProficiency: "Strong",
      requiredProficiency: "Strong",
      candidateConfidence: 90,
      evidenceCount: 3,
      evidenceSummary: "Evidenced across DevPlatform SaaS and claimed skills.",
      gapRationale: "Strong alignment with core language stack.",
      suggestedAction: "Highlight complex type systems and async architecture.",
      priority: "Low",
      priorityScore: 20,
      priorityRationale: "Fully matched skill.",
      relatedCandidateSkills: [],
    },
  ],
  optionalGaps: [],
  generatedAt: new Date().toISOString(),
};

describe("Interview Simulator Engine", () => {
  it("generates a balanced interview plan grounded in resume, job, and gaps", () => {
    const questions = generateInterviewQuestions({
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
      customCount: 5,
    });

    expect(questions).toHaveLength(5);

    // Validate each question against schema
    for (const q of questions) {
      const validated = simulatorQuestionSchema.safeParse(q);
      expect(validated.success).toBe(true);
    }

    // Role-specific check
    expect(questions.some((q) => q.type === "role_specific")).toBe(true);
    // Project check
    expect(questions.some((q) => q.type === "project" && q.relatedProject === "DevPlatform SaaS")).toBe(true);
    // Technical check
    expect(questions.some((q) => q.type === "technical" && q.focusSkill === "TypeScript")).toBe(true);
    // Gap check
    expect(questions.some((q) => q.type === "technical" && q.focusSkill === "Docker")).toBe(true);
    // Behavioral check
    expect(questions.some((q) => q.type === "behavioral")).toBe(true);
  });

  it("evaluates a detailed, technical answer accurately", () => {
    const question = generateInterviewQuestions({
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
    })[2]; // Technical question

    const detailedAnswer = `In our production TypeScript services, we enforce strict immutability and handle state consistency using transactional outbox patterns. For asynchronous operations, we wrap external calls in circuit breakers with exponential backoff and jitter to prevent cascading failures. We maintain distributed trace IDs across HTTP and queue boundaries to monitor latency bottlenecks and log structured errors with Datadog.`;

    const evalResult = evaluateInterviewAnswer({
      question,
      answer: detailedAnswer,
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
    });

    const parsed = simulatorAnswerEvaluationSchema.safeParse(evalResult);
    expect(parsed.success).toBe(true);

    expect(evalResult.technicalAccuracy).toBeGreaterThanOrEqual(75);
    expect(evalResult.depth).toBeGreaterThanOrEqual(70);
    expect(evalResult.communication).toBeGreaterThanOrEqual(70);
    expect(evalResult.strengthsObserved.length).toBeGreaterThan(0);
    expect(evalResult.followUpQuestion).toBeDefined();
    // Ensure no hidden chain-of-thought
    expect(evalResult.conciseFeedback).not.toContain("chain of thought");
    expect(evalResult.conciseFeedback).not.toContain("Prompt:");
  });

  it("evaluates a brief, hand-wavy answer with lower scores and concrete areas to improve", () => {
    const question = generateInterviewQuestions({
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
    })[1]; // Project question

    const weakAnswer = "I just wrote good clean code and used git.";

    const evalResult = evaluateInterviewAnswer({
      question,
      answer: weakAnswer,
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
    });

    expect(evalResult.technicalAccuracy).toBeLessThan(50);
    expect(evalResult.depth).toBeLessThan(50);
    expect(evalResult.areasToImprove.length).toBeGreaterThan(0);
    expect(evalResult.areasToImprove[0]).toContain("Elaborate");
  });

  it("generates a final interview report after completing exchanges", () => {
    const questions = generateInterviewQuestions({
      resume: sampleResume,
      matrix: sampleMatrix,
      job: sampleJob,
      gapReport: sampleGapReport,
      customCount: 2,
    });

    const exchanges: SimulatorExchange[] = [
      {
        id: "ex-1",
        step: 1,
        question: questions[0],
        answer: "I structure services into clear domain boundaries with asynchronous queues and automated integration testing.",
        evaluation: evaluateInterviewAnswer({ question: questions[0], answer: "I structure services into clear domain boundaries with asynchronous queues and automated integration testing." }),
        timestamp: new Date().toISOString(),
      },
      {
        id: "ex-2",
        step: 2,
        question: questions[1],
        answer: "In DevPlatform SaaS, we faced p99 latency spikes during peak deployments. We optimized PostgreSQL indexing by adding composite indexes and implemented Redis caching, bringing p99 down by 35%.",
        evaluation: evaluateInterviewAnswer({ question: questions[1], answer: "In DevPlatform SaaS, we faced p99 latency spikes during peak deployments. We optimized PostgreSQL indexing by adding composite indexes and implemented Redis caching, bringing p99 down by 35%." }),
        timestamp: new Date().toISOString(),
      },
    ];

    const report = generateFinalInterviewReport({
      sessionId: "session-test-1",
      jobTitle: sampleJob.title,
      company: sampleJob.company!,
      exchanges,
    });

    const parsed = simulatorFinalReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);

    expect(report.overallScore).toBeGreaterThanOrEqual(60);
    expect(["Strong Hire", "Hire", "Leaning Hire"]).toContain(report.overallRating);
    expect(report.technicalAccuracy.score).toBeGreaterThan(0);
    expect(report.depth.score).toBeGreaterThan(0);
    expect(report.communication.score).toBeGreaterThan(0);
    expect(report.projectUnderstanding.score).toBeGreaterThan(0);
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.actionableRecommendations.length).toBeGreaterThan(0);
  });
});
