import crypto from "node:crypto";
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateFinalInterviewReport,
  type InterviewSessionState,
  type SimulatorExchange,
  type ResumeExtraction,
  type SkillMatrix,
  type JobExtraction,
  type GapAnalysisReport,
  type SimulatorQuestion,
} from "@skilltwin/contracts";
import { resumeRepository } from "../resume/resume.repository.js";
import { jobRepository } from "../job/job.repository.js";
import { gapRepository } from "../gap/gap.repository.js";
import { simulatorRepository, SimulatorRepository } from "./simulator.repository.js";

export class SimulatorService {
  constructor(
    private readonly repo: SimulatorRepository = simulatorRepository,
    private readonly resumes = resumeRepository,
    private readonly jobs = jobRepository,
    private readonly gaps = gapRepository,
  ) {}

  private getFallbackResume(): ResumeExtraction {
    return {
      id: "resume-default-fallback",
      fileName: "default_profile.pdf",
      fileType: "pdf",
      fileSizeBytes: 2048,
      rawText: "Full-Stack Engineer with React, TypeScript, Node.js, and PostgreSQL expertise.",
      profile: {
        name: "Alex Morgan",
        summary: "Software Engineer with 4+ years of experience building scalable web applications.",
      },
      skillsClaimed: ["TypeScript", "React", "Node.js", "PostgreSQL", "REST APIs"],
      projects: [
        {
          name: "DevPlatform SaaS",
          description: "Full-stack developer platform with real-time analytics and webhook notifications.",
          technologies: ["React", "TypeScript", "Node.js", "PostgreSQL"],
          bullets: [
            "Architected decoupled asynchronous worker queues reducing job latency by 40%",
            "Built responsive React dashboards used by 10,000+ active developers",
          ],
        },
      ],
      experience: [],
      education: [],
      certifications: [],
      achievements: [],
      parsedAt: new Date().toISOString(),
    };
  }

  private getFallbackJob(): JobExtraction {
    return {
      id: "job-default-fallback",
      title: "Senior Full-Stack Engineer",
      company: "Acme Cloud Technologies",
      location: "San Francisco, CA",
      rawText: "Looking for a Senior Full-Stack Engineer skilled in TypeScript, React, Docker, and PostgreSQL.",
      experience: { level: "Senior", minYears: 4 },
      requiredSkills: [
        { canonicalName: "TypeScript", category: "Programming Languages", importance: "Required", minimumProficiency: "Strong" },
        { canonicalName: "React", category: "Frameworks & Libraries", importance: "Required", minimumProficiency: "Strong" },
        { canonicalName: "Docker", category: "DevOps & Cloud", importance: "Required", minimumProficiency: "Intermediate" },
      ],
      preferredSkills: [
        { canonicalName: "GraphQL", category: "Frameworks & Libraries", importance: "Preferred", minimumProficiency: "Intermediate" },
      ],
      responsibilities: ["Lead full-stack feature architecture", "Maintain resilient production microservices"],
      qualifications: ["4+ years software development experience"],
      keywords: {
        programmingLanguages: ["TypeScript"],
        frameworks: ["React"],
        libraries: [],
        databases: ["PostgreSQL"],
        tools: ["Docker"],
        cloudDevOps: ["Docker"],
        cybersecurity: [],
        softSkills: ["Collaboration", "Mentorship"],
        generalKeywords: [],
        technicalSkills: ["TypeScript", "React", "Docker"],
      },
      parsedAt: new Date().toISOString(),
    };
  }

  private getFallbackMatrix(resumeId: string): SkillMatrix {
    return {
      resumeId,
      items: [
        {
          canonicalName: "TypeScript",
          category: "Programming Languages",
          aliases: ["ts"],
          proficiency: "Strong",
          confidence: 92,
          evidenceLevel: "Demonstrated",
          evidence: [{ id: "ev-1", sourceType: "project", context: "Architected core application in TypeScript", weight: 85, verified: true }],
          explanation: "Demonstrated in DevPlatform SaaS.",
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
          confidence: 90,
          evidenceLevel: "Demonstrated",
          evidence: [{ id: "ev-2", sourceType: "project", context: "Built React dashboard with state management", weight: 85, verified: true }],
          explanation: "Demonstrated in UI layer.",
          missingEvidence: [],
          relatedSkills: ["TypeScript"],
          claimed: true,
          demonstrated: true,
        },
      ],
      summary: {
        totalSkills: 2,
        demonstratedCount: 2,
        claimedOnlyCount: 0,
        weakEvidenceCount: 0,
        averageConfidence: 91,
        topSkills: ["TypeScript", "React"],
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private getFallbackGapReport(resumeId: string, jobId: string): GapAnalysisReport {
    return {
      id: "gap-default-fallback",
      resumeId,
      jobId,
      targetRole: "Senior Full-Stack Engineer",
      company: "Acme Cloud Technologies",
      summary: {
        totalRequired: 3,
        totalPreferred: 1,
        matchCount: 2,
        partialCount: 0,
        criticalGapCount: 1,
        weakEvidenceCount: 0,
        optionalGapCount: 0,
        alignmentRating: "Moderate",
        alignmentScore: 78,
        alignmentExplanation: "Strong match in TypeScript and React, but critical gap in Docker.",
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
          evidenceSummary: "No Docker containerization evidence found.",
          gapRationale: "Containerization is required for deployment workflows.",
          suggestedAction: "Complete containerized project using Docker compose.",
          priority: "Critical",
          priorityScore: 90,
          priorityRationale: "Mandatory skill with no current evidence.",
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
          candidateConfidence: 92,
          evidenceCount: 2,
          evidenceSummary: "Evidenced in core project architecture.",
          gapRationale: "Core strength.",
          suggestedAction: "Highlight system architecture in interviews.",
          priority: "Low",
          priorityScore: 20,
          priorityRationale: "Fully verified match.",
          relatedCandidateSkills: [],
        },
      ],
      optionalGaps: [],
      generatedAt: new Date().toISOString(),
    };
  }

  startInterview(params: {
    resumeId?: string;
    jobId?: string;
    customQuestionsCount?: number;
  }): InterviewSessionState {
    const resume =
      (params.resumeId ? this.resumes.getResume(params.resumeId) : undefined) ||
      this.resumes.getLatestResume() ||
      this.getFallbackResume();

    const matrix =
      this.resumes.getMatrix(resume.id) ||
      this.getFallbackMatrix(resume.id);

    const job =
      (params.jobId ? this.jobs.getJob(params.jobId) : undefined) ||
      this.jobs.getLatestJob() ||
      this.getFallbackJob();

    const gapReport =
      this.gaps.getReportByResumeAndJob(resume.id, job.id) ||
      this.gaps.getLatestReport() ||
      this.getFallbackGapReport(resume.id, job.id);

    const count = params.customQuestionsCount || 5;

    const plannedQuestions = generateInterviewQuestions({
      resume,
      matrix,
      job,
      gapReport,
      customCount: count,
    });

    const sessionId = `sim-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();

    const session: InterviewSessionState = {
      id: sessionId,
      resumeId: resume.id,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company || "Target Company",
      status: "in_progress",
      currentStepIndex: 0,
      totalSteps: plannedQuestions.length,
      currentQuestion: plannedQuestions[0] || null,
      plannedQuestions,
      exchanges: [],
      finalReport: null,
      createdAt: now,
      updatedAt: now,
    };

    this.repo.saveSession(session);
    return session;
  }

  submitAnswer(params: {
    sessionId: string;
    questionId: string;
    answer: string;
  }): { session: InterviewSessionState; exchange: SimulatorExchange } {
    const session = this.repo.getSession(params.sessionId);
    if (!session) {
      throw new Error(`Interview session '${params.sessionId}' not found.`);
    }

    if (session.status === "completed") {
      throw new Error("This interview session has already been completed.");
    }

    // Identify the active question
    const activeQuestion =
      session.currentQuestion && session.currentQuestion.id === params.questionId
        ? session.currentQuestion
        : session.plannedQuestions.find((q) => q.id === params.questionId) ||
          session.currentQuestion;

    if (!activeQuestion) {
      throw new Error(`Question '${params.questionId}' not found in session.`);
    }

    // Context for evaluation
    const resume = this.resumes.getResume(session.resumeId) || this.getFallbackResume();
    const matrix = this.resumes.getMatrix(session.resumeId) || this.getFallbackMatrix(session.resumeId);
    const job = this.jobs.getJob(session.jobId) || this.getFallbackJob();
    const gapReport = this.gaps.getReportByResumeAndJob(session.resumeId, session.jobId) || this.getFallbackGapReport(session.resumeId, session.jobId);

    // Evaluate answer adaptively
    const evaluation = evaluateInterviewAnswer({
      question: activeQuestion,
      answer: params.answer,
      previousExchanges: session.exchanges,
      resume,
      matrix,
      job,
      gapReport,
    });

    const exchange: SimulatorExchange = {
      id: `ex-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      step: session.exchanges.length + 1,
      question: activeQuestion,
      answer: params.answer.trim(),
      evaluation,
      timestamp: new Date().toISOString(),
    };

    session.exchanges.push(exchange);

    // Determine next step
    const nextIndex = session.currentStepIndex + 1;
    if (nextIndex < session.plannedQuestions.length) {
      session.currentStepIndex = nextIndex;
      session.currentQuestion = session.plannedQuestions[nextIndex];
    } else {
      // Completed all planned questions
      session.status = "completed";
      session.currentQuestion = null;
      session.finalReport = generateFinalInterviewReport({
        sessionId: session.id,
        jobTitle: session.jobTitle,
        company: session.company,
        exchanges: session.exchanges,
      });
    }

    session.updatedAt = new Date().toISOString();
    this.repo.saveSession(session);

    return { session, exchange };
  }

  completeInterview(sessionId: string): InterviewSessionState {
    const session = this.repo.getSession(sessionId);
    if (!session) {
      throw new Error(`Interview session '${sessionId}' not found.`);
    }

    if (session.status !== "completed") {
      session.status = "completed";
      session.currentQuestion = null;
      session.finalReport = generateFinalInterviewReport({
        sessionId: session.id,
        jobTitle: session.jobTitle,
        company: session.company,
        exchanges: session.exchanges,
      });
      session.updatedAt = new Date().toISOString();
      this.repo.saveSession(session);
    }

    return session;
  }

  getSession(id: string): InterviewSessionState | undefined {
    return this.repo.getSession(id);
  }

  getHistory() {
    return this.repo.listHistory();
  }

  getLatestSession(): InterviewSessionState | undefined {
    return this.repo.getLatestSession();
  }
}

export const simulatorService = new SimulatorService();
