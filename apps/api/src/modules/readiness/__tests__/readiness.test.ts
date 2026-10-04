import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import {
  computeCareerReadiness,
  careerReadinessReportSchema,
  type ResumeExtraction,
  type SkillMatrix,
  type JobExtraction,
  type GapAnalysisReport,
} from "@skilltwin/contracts";

describe("Career Readiness Engine & API (Phase 8)", () => {
  const mockResume: ResumeExtraction = {
    id: "resume-readiness-test",
    fileName: "alex_resume.pdf",
    fileType: "pdf",
    fileSizeBytes: 102400,
    rawText: "Alex Rivera, Senior Full Stack Engineer. React, Node.js, Go, Docker, PostgreSQL, Redis.",
    profile: {
      name: "Alex Rivera",
      email: "alex@example.com",
      summary: "Full Stack Engineer with 5 years experience.",
      yearsOfExperienceEstimate: 5,
    },
    skillsClaimed: ["React", "Node.js", "Go", "Docker", "PostgreSQL", "Redis", "Jest"],
    experience: [
      {
        company: "Nexus Systems",
        role: "Senior Software Engineer",
        startDate: "2021-01-01",
        bullets: [
          "Engineered distributed Node.js and Go microservices handling 10M requests daily",
          "Built React dashboards for cluster monitoring",
        ],
        technologies: ["Node.js", "Go", "React"],
        current: true,
      },
    ],
    projects: [
      {
        name: "DevPulse",
        description: "Telemetry dashboard aggregating git metrics in real time",
        technologies: ["React", "TypeScript", "Node.js", "Docker", "Redis"],
        bullets: ["Built responsive dashboard in React and containerized with Docker"],
      },
    ],
    education: [
      {
        institution: "State University",
        degree: "B.S. Computer Science",
        startDate: "2016-09-01",
        endDate: "2020-05-01",
      },
    ],
    certifications: [],
    achievements: [],
    parsedAt: new Date().toISOString(),
  };

  const mockMatrix: SkillMatrix = {
    resumeId: "resume-readiness-test",
    generatedAt: new Date().toISOString(),
    summary: {
      totalSkills: 6,
      demonstratedCount: 5,
      claimedOnlyCount: 1,
      weakEvidenceCount: 1,
      averageConfidence: 82,
      topSkills: ["React", "Node.js", "Go"],
    },
    items: [
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["React.js"],
        proficiency: "Strong",
        confidence: 94,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-1",
            sourceType: "work_experience",
            context: "Built React dashboards for cluster monitoring",
            weight: 90,
            verified: true,
          },
        ],
        explanation: "Demonstrated in production role.",
        missingEvidence: [],
        relatedSkills: ["TypeScript"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Node.js",
        category: "Backend",
        aliases: ["Node"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-2",
            sourceType: "work_experience",
            context: "Engineered distributed Node.js microservices",
            weight: 90,
            verified: true,
          },
        ],
        explanation: "Demonstrated in employment.",
        missingEvidence: [],
        relatedSkills: ["Express"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Go",
        category: "Programming Languages",
        aliases: ["Golang"],
        proficiency: "Intermediate",
        confidence: 80,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-3",
            sourceType: "work_experience",
            context: "Engineered distributed Go microservices",
            weight: 80,
            verified: true,
          },
        ],
        explanation: "Verified Go usage.",
        missingEvidence: [],
        relatedSkills: ["Docker"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Docker",
        category: "DevOps",
        aliases: ["Containerization"],
        proficiency: "Intermediate",
        confidence: 72,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-4",
            sourceType: "project",
            context: "containerized with Docker",
            weight: 72,
            verified: true,
          },
        ],
        explanation: "Containerized project repository.",
        missingEvidence: [],
        relatedSkills: ["Kubernetes"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Redis",
        category: "Database",
        aliases: ["Cache"],
        proficiency: "Intermediate",
        confidence: 75,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-5",
            sourceType: "project",
            context: "caching with Redis",
            weight: 75,
            verified: true,
          },
        ],
        explanation: "Project caching layer.",
        missingEvidence: [],
        relatedSkills: ["PostgreSQL"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Jest",
        category: "Testing",
        aliases: ["Unit Testing"],
        proficiency: "Weak",
        confidence: 35,
        evidenceLevel: "ClaimedOnly",
        evidence: [],
        explanation: "Mentioned only in skills list with no verifiable test suites.",
        missingEvidence: ["No unit tests in repository"],
        relatedSkills: ["Vitest"],
        claimed: true,
        demonstrated: false,
      },
    ],
  };

  const mockJob: JobExtraction = {
    id: "job-readiness-test",
    title: "Senior Full Stack Engineer",
    company: "Linear Systems Inc.",
    rawText: "We need a Senior Full Stack Engineer proficient in React, Node.js, Docker, and Automated Testing.",
    requiredSkills: [
      {
        canonicalName: "React",
        category: "Frontend",
        importance: "Required",
        minimumProficiency: "Strong",
      },
      {
        canonicalName: "Node.js",
        category: "Backend",
        importance: "Required",
        minimumProficiency: "Strong",
      },
      {
        canonicalName: "Docker",
        category: "DevOps",
        importance: "Required",
        minimumProficiency: "Intermediate",
      },
      {
        canonicalName: "Automated Testing",
        category: "Testing",
        importance: "Required",
        minimumProficiency: "Intermediate",
      },
    ],
    preferredSkills: [
      {
        canonicalName: "Redis",
        category: "Database",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
      },
      {
        canonicalName: "Kubernetes",
        category: "Cloud",
        importance: "Preferred",
        minimumProficiency: "Beginner",
      },
    ],
    responsibilities: ["Build scalable web apps", "Ensure test reliability"],
    keywords: {
      programmingLanguages: ["JavaScript", "TypeScript"],
      frameworks: ["React"],
      libraries: ["Express"],
      databases: ["Redis"],
      tools: ["Docker"],
      cloudDevOps: ["Kubernetes"],
      cybersecurity: [],
      softSkills: [],
      generalKeywords: [],
      technicalSkills: ["Testing"],
    },
    qualifications: ["B.S. in Computer Science"],
    experience: {
      minYears: 4,
      level: "Senior",
    },
    parsedAt: new Date().toISOString(),
  };

  const mockGapReport: GapAnalysisReport = {
    id: "gap-readiness-test",
    resumeId: "resume-readiness-test",
    jobId: "job-readiness-test",
    targetRole: "Senior Full Stack Engineer",
    company: "Linear Systems Inc.",
    summary: {
      totalRequired: 4,
      totalPreferred: 2,
      matchCount: 3,
      partialCount: 1,
      criticalGapCount: 1,
      weakEvidenceCount: 1,
      optionalGapCount: 1,
      alignmentRating: "Strong",
      alignmentScore: 78,
      alignmentExplanation: "Strong match on primary web stack with 1 critical gap in testing.",
    },
    criticalGaps: [
      {
        canonicalName: "Automated Testing",
        category: "Testing",
        status: "GAP",
        importance: "Required",
        candidateProficiency: "Not Detected",
        requiredProficiency: "Intermediate",
        candidateConfidence: 20,
        evidenceCount: 0,
        evidenceSummary: "No test files or CI integration evidenced.",
        gapRationale: "Testing is mandatory for senior quality assurance.",
        suggestedAction: "Add unit and integration tests to DevPulse.",
        priority: "Critical",
        priorityScore: 85,
        priorityRationale: "Mandatory requirement with no code proof.",
        relatedCandidateSkills: ["Jest"],
      },
    ],
    weakEvidence: [
      {
        canonicalName: "Docker",
        category: "DevOps",
        status: "WEAK_EVIDENCE",
        importance: "Required",
        candidateProficiency: "Intermediate",
        requiredProficiency: "Intermediate",
        candidateConfidence: 72,
        evidenceCount: 1,
        evidenceSummary: "Single project mention.",
        gapRationale: "Containerization is required.",
        suggestedAction: "Document multi-stage Docker builds and compose files.",
        priority: "High",
        priorityScore: 70,
        priorityRationale: "Single source evidence.",
        relatedCandidateSkills: [],
      },
    ],
    partialGaps: [],
    strongMatches: [
      {
        canonicalName: "React",
        category: "Frontend",
        status: "MATCH",
        importance: "Required",
        candidateProficiency: "Strong",
        requiredProficiency: "Strong",
        candidateConfidence: 94,
        evidenceCount: 1,
        evidenceSummary: "Demonstrated in production role.",
        gapRationale: "Fully satisfies role requirement.",
        suggestedAction: "Keep as primary technical highlight.",
        priority: "Low",
        priorityScore: 10,
        priorityRationale: "Strong match.",
        relatedCandidateSkills: [],
      },
      {
        canonicalName: "Node.js",
        category: "Backend",
        status: "MATCH",
        importance: "Required",
        candidateProficiency: "Strong",
        requiredProficiency: "Strong",
        candidateConfidence: 90,
        evidenceCount: 1,
        evidenceSummary: "Demonstrated in production role.",
        gapRationale: "Fully satisfies backend requirement.",
        suggestedAction: "Highlight microservices experience.",
        priority: "Low",
        priorityScore: 10,
        priorityRationale: "Strong match.",
        relatedCandidateSkills: [],
      },
      {
        canonicalName: "Redis",
        category: "Database",
        status: "MATCH",
        importance: "Preferred",
        candidateProficiency: "Intermediate",
        requiredProficiency: "Intermediate",
        candidateConfidence: 75,
        evidenceCount: 1,
        evidenceSummary: "Demonstrated in project.",
        gapRationale: "Satisfies preferred cache requirement.",
        suggestedAction: "Keep as supporting skill.",
        priority: "Low",
        priorityScore: 15,
        priorityRationale: "Preferred match.",
        relatedCandidateSkills: [],
      },
    ],
    optionalGaps: [
      {
        canonicalName: "Kubernetes",
        category: "Cloud",
        status: "OPTIONAL_GAP",
        importance: "Preferred",
        candidateProficiency: "Not Detected",
        requiredProficiency: "Beginner",
        candidateConfidence: 0,
        evidenceCount: 0,
        evidenceSummary: "No Kubernetes evidence.",
        gapRationale: "Nice-to-have skill for cluster deployments.",
        suggestedAction: "Explore Minikube or local cluster setup.",
        priority: "Low",
        priorityScore: 25,
        priorityRationale: "Optional preferred skill.",
        relatedCandidateSkills: ["Docker"],
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  describe("Deterministic Engine Logic", () => {
    it("computes complete Career Readiness report conforming to schema", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      // Must validate against Zod schema
      expect(careerReadinessReportSchema.safeParse(report).success).toBe(true);

      // Verify core fields
      expect(report.candidateName).toBe("Alex Rivera");
      expect(report.targetRole).toBe("Senior Full Stack Engineer");
      expect(report.targetCompany).toBe("Linear Systems Inc.");
      expect(report.overallScore).toBeGreaterThanOrEqual(50);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(["Job Ready", "Competitive", "Developing", "Needs Targeted Prep"]).toContain(
        report.overallRating
      );
    });

    it("calculates skill coverage breakdown distinguishing required and preferred skills", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      expect(report.skillCoverage.requiredTotal).toBe(4);
      expect(report.skillCoverage.preferredTotal).toBe(2);
      expect(report.skillCoverage.criticalGapsCount).toBe(1);
      expect(report.skillCoverage.overallPercentage).toBe(58);
      expect(report.skillCoverage.requiredPercentage).toBe(63);
    });

    it("identifies strongest and weakest areas with truthful evidence summaries", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      expect(report.strongestAreas.length).toBeGreaterThan(0);
      const strongestCats = report.strongestAreas.map((a) => a.category);
      expect(strongestCats.some((c) => c === "Frontend" || c === "Backend" || c === "Programming Languages")).toBe(true);

      expect(report.weakestAreas.length).toBeGreaterThan(0);
      const weakestCats = report.weakestAreas.map((a) => a.category);
      expect(weakestCats.some((c) => c === "Testing" || c === "Cloud")).toBe(true);
    });

    it("computes evidence strength distribution across tiers without rainbow analytics", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      expect(report.evidenceStrength.totalSkills).toBe(6);
      expect(report.evidenceStrength.tiers.length).toBe(4);

      const workTier = report.evidenceStrength.tiers.find((t) => t.tier === "work_experience");
      expect(workTier?.skillCount).toBe(3); // React, Node.js, Go

      const projectTier = report.evidenceStrength.tiers.find((t) => t.tier === "project");
      expect(projectTier?.skillCount).toBe(2); // Docker, Redis

      const claimedTier = report.evidenceStrength.tiers.find((t) => t.tier === "claimed_only");
      expect(claimedTier?.skillCount).toBe(1); // Jest
    });

    it("generates top job gaps prioritized with actionable tips", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      expect(report.topJobGaps.length).toBeGreaterThan(0);
      expect(report.topJobGaps[0].skill).toBe("Automated Testing");
      expect(report.topJobGaps[0].priorityLevel).toBe("Critical");
      expect(report.topJobGaps[0].actionTip).toBeDefined();
    });

    it("generates high-leverage 'Your next best actions' matching user requirements", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
        job: mockJob,
        gapReport: mockGapReport,
      });

      expect(report.nextBestActions.length).toBeGreaterThanOrEqual(3);

      const titles = report.nextBestActions.map((a) => a.title);
      // Explicit user examples:
      expect(titles).toContain("Improve testing evidence");
      expect(titles).toContain("Build a Docker-based project");
      expect(titles).toContain("Add stronger project evidence");

      // Verify each action carries evidenceBasis and concrete steps
      for (const act of report.nextBestActions) {
        expect(act.whyItMatters.length).toBeGreaterThan(10);
        expect(act.evidenceBasis.length).toBeGreaterThan(5);
        expect(act.actionSteps.length).toBeGreaterThan(0);
        expect(act.targetScreen).toBeDefined();
      }
    });

    it("handles matrix-only fallback when no job or gap report is present", () => {
      const report = computeCareerReadiness({
        resume: mockResume,
        matrix: mockMatrix,
      });

      expect(report.scoreBreakdown.hasJobContext).toBe(false);
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.topJobGaps).toEqual([]);
      expect(report.nextBestActions.length).toBeGreaterThan(0);
    });
  });

  describe("Readiness HTTP Endpoints", () => {
    it("POST /api/v1/readiness/evaluate returns 200 with schema-valid CareerReadinessReport", async () => {
      const res = await request(app)
        .post("/api/v1/readiness/evaluate")
        .send({
          resume: mockResume,
          matrix: mockMatrix,
          job: mockJob,
          gapReport: mockGapReport,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.overallScore).toBeDefined();
      expect(res.body.data.nextBestActions.length).toBeGreaterThan(0);
      expect(careerReadinessReportSchema.safeParse(res.body.data).success).toBe(true);
    });

    it("POST /api/v1/readiness/evaluate returns 400 when matrix is invalid or missing", async () => {
      const res = await request(app)
        .post("/api/v1/readiness/evaluate")
        .send({ resume: mockResume });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_INPUT");
    });

    it("GET /api/v1/readiness/latest returns 200 after report is evaluated", async () => {
      const res = await request(app).get("/api/v1/readiness/latest");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.overallScore).toBeDefined();
    });
  });
});
