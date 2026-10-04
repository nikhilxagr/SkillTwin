import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { gapEngine, GapEngine } from "../gap.engine.js";
import { gapRepository } from "../gap.repository.js";
import { resumeRepository } from "../../resume/resume.repository.js";
import { jobRepository } from "../../job/job.repository.js";
import type { SkillMatrix, JobExtraction } from "@skilltwin/contracts";

describe("Skill Gap Engine (Phase 5)", () => {
  beforeEach(() => {
    gapRepository.clear();
    resumeRepository.clear();
    jobRepository.clear();
  });

  const mockMatrix: SkillMatrix = {
    resumeId: "resume-001",
    items: [
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["React.js", "ReactJS"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "p1",
            sourceType: "project",
            context: "Architected modern React 18 dashboard with hooks and Context API.",
            weight: 90,
            verified: true,
          },
          {
            id: "w1",
            sourceType: "work_experience",
            context: "Led frontend development implementing reusable React components.",
            weight: 85,
            verified: true,
          },
        ],
        explanation: "Verified React production experience.",
        missingEvidence: [],
        relatedSkills: ["TypeScript"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "TypeScript",
        category: "Languages",
        aliases: ["TS"],
        proficiency: "Strong",
        confidence: 85,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "p1",
            sourceType: "project",
            context: "Built full-stack TypeScript services with strict compiler configuration.",
            weight: 85,
            verified: true,
          },
        ],
        explanation: "Verified TypeScript full-stack experience.",
        missingEvidence: [],
        relatedSkills: ["React"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Python",
        category: "Languages",
        aliases: ["py"],
        proficiency: "Beginner",
        confidence: 50,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "p2",
            sourceType: "project",
            context: "Created Python data parsing script for JSON metric dumps.",
            weight: 50,
            verified: true,
          },
        ],
        explanation: "Basic Python scripting detected.",
        missingEvidence: ["Large-scale backend architecture"],
        relatedSkills: [],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "GraphQL",
        category: "Backend",
        aliases: [],
        proficiency: "Beginner",
        confidence: 35,
        evidenceLevel: "WeakEvidence",
        evidence: [
          {
            id: "e1",
            sourceType: "education",
            context: "GraphQL listed in coursework overview.",
            weight: 30,
            verified: true,
          },
        ],
        explanation: "Single course mention with no production projects.",
        missingEvidence: ["Production GraphQL schema definition", "Resolvers implementation"],
        relatedSkills: [],
        claimed: true,
        demonstrated: false,
      },
      {
        canonicalName: "PostgreSQL",
        category: "Databases",
        aliases: ["Postgres"],
        proficiency: "Intermediate",
        confidence: 75,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "p1",
            sourceType: "project",
            context: "Designed normalized relational schema and wrote PostgreSQL queries.",
            weight: 75,
            verified: true,
          },
        ],
        explanation: "Demonstrated relational database usage.",
        missingEvidence: [],
        relatedSkills: [],
        claimed: true,
        demonstrated: true,
      },
    ],
    summary: {
      totalSkills: 5,
      demonstratedCount: 4,
      claimedOnlyCount: 0,
      weakEvidenceCount: 1,
      averageConfidence: 67,
      topSkills: ["React", "TypeScript", "PostgreSQL"],
    },
    generatedAt: "2026-10-04T12:00:00Z",
  };

  const mockJob: JobExtraction = {
    id: "job-001",
    title: "Senior Full Stack Engineer",
    company: "Linear Systems",
    rawText: "We need a Senior Full Stack Engineer...",
    experience: {
      minYears: 5,
      level: "Senior",
      description: "5+ years required",
    },
    requiredSkills: [
      {
        canonicalName: "React",
        category: "Frontend",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Deep React proficiency required.",
      },
      {
        canonicalName: "TypeScript",
        category: "Languages",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Strong TypeScript experience across stack.",
      },
      {
        canonicalName: "Python",
        category: "Languages",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Strong Python backend service development.",
      },
      {
        canonicalName: "GraphQL",
        category: "Backend",
        importance: "Required",
        minimumProficiency: "Intermediate",
        contextSentence: "Experience building production GraphQL APIs.",
      },
      {
        canonicalName: "Docker",
        category: "Cloud/DevOps",
        importance: "Required",
        minimumProficiency: "Intermediate",
        contextSentence: "Containerized deployments using Docker.",
      },
    ],
    preferredSkills: [
      {
        canonicalName: "PostgreSQL",
        category: "Databases",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
        contextSentence: "Relational database expertise with PostgreSQL.",
      },
      {
        canonicalName: "Kubernetes",
        category: "Cloud/DevOps",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
        contextSentence: "Familiarity with Kubernetes orchestration.",
      },
    ],
    responsibilities: ["Build scalable features", "Review architecture"],
    qualifications: ["5+ years experience", "B.S. in CS"],
    keywords: {
      programmingLanguages: ["TypeScript", "Python"],
      frameworks: ["React"],
      libraries: ["GraphQL"],
      databases: ["PostgreSQL"],
      tools: ["Docker"],
      cloudDevOps: ["Kubernetes"],
      cybersecurity: [],
      softSkills: [],
      generalKeywords: [],
      technicalSkills: ["React", "TypeScript", "Docker"],
      cloud: ["Kubernetes"],
    },
    parsedAt: "2026-10-04T12:00:00Z",
  };

  it("classifies strong matches when candidate proficiency meets or exceeds requirement with credible evidence", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    const reactMatch = report.strongMatches.find((m) => m.canonicalName === "React");
    expect(reactMatch).toBeDefined();
    expect(reactMatch?.status).toBe("MATCH");
    expect(reactMatch?.importance).toBe("Required");
    expect(reactMatch?.candidateProficiency).toBe("Strong");
    expect(reactMatch?.requiredProficiency).toBe("Strong");
    expect(reactMatch?.evidenceCount).toBe(2);

    const tsMatch = report.strongMatches.find((m) => m.canonicalName === "TypeScript");
    expect(tsMatch).toBeDefined();
    expect(tsMatch?.status).toBe("MATCH");
  });

  it("classifies partial matches when candidate has foundational evidence but job requires Strong proficiency", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    const pythonPartial = report.partialGaps.find((g) => g.canonicalName === "Python");
    expect(pythonPartial).toBeDefined();
    expect(pythonPartial?.status).toBe("PARTIAL");
    expect(pythonPartial?.importance).toBe("Required");
    expect(pythonPartial?.candidateProficiency).toBe("Beginner");
    expect(pythonPartial?.requiredProficiency).toBe("Strong");
    expect(pythonPartial?.gapRationale).toContain("Beginner");
    expect(pythonPartial?.suggestedAction).toBeDefined();
  });

  it("flags weak evidence when technology appears only once without production depth (Rule: do not assume proficiency)", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    const graphqlWeak = report.weakEvidence.find((w) => w.canonicalName === "GraphQL");
    expect(graphqlWeak).toBeDefined();
    expect(graphqlWeak?.status).toBe("WEAK_EVIDENCE");
    expect(graphqlWeak?.importance).toBe("Required");
    expect(graphqlWeak?.gapRationale).toContain("single keyword");
    expect(graphqlWeak?.suggestedAction).toContain("Expand project bullet points");
  });

  it("identifies critical gaps for missing required skills (Rule: required skills have highest priority)", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    const dockerGap = report.criticalGaps.find((g) => g.canonicalName === "Docker");
    expect(dockerGap).toBeDefined();
    expect(dockerGap?.status).toBe("GAP");
    expect(dockerGap?.importance).toBe("Required");
    expect(dockerGap?.candidateProficiency).toBe("Not Detected");
    expect(dockerGap?.evidenceCount).toBe(0);
    expect(dockerGap?.gapRationale).toContain("zero verifiable evidence");
    expect(dockerGap?.suggestedAction).toContain("Docker");
  });

  it("identifies optional gaps for missing preferred skills without treating them as critical blockers", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    const k8sOptional = report.optionalGaps.find((o) => o.canonicalName === "Kubernetes");
    expect(k8sOptional).toBeDefined();
    expect(k8sOptional?.importance).toBe("Preferred");
    expect(k8sOptional?.status).toBe("OPTIONAL_GAP");
    expect(k8sOptional?.gapRationale).toContain("Secondary/preferred qualification");

    // Preferred skill that is met with credible evidence is classified as MATCH
    const postgresMatch = report.strongMatches.find((m) => m.canonicalName === "PostgreSQL");
    expect(postgresMatch).toBeDefined();
    expect(postgresMatch?.status).toBe("MATCH");
    expect(postgresMatch?.importance).toBe("Preferred");
  });

  it("does not treat aliases as different skills (Rule: aliases normalize to canonical)", () => {
    // Job specifies 'React.js' and 'K8s', candidate matrix has 'React' and 'Kubernetes'
    const aliasJob: JobExtraction = {
      ...mockJob,
      requiredSkills: [
        {
          canonicalName: "React.js", // Alias for React
          category: "Frontend",
          importance: "Required",
          minimumProficiency: "Strong",
        },
      ],
      preferredSkills: [
        {
          canonicalName: "K8s", // Alias for Kubernetes
          category: "Cloud/DevOps",
          importance: "Preferred",
          minimumProficiency: "Intermediate",
        },
      ],
    };

    const report = gapEngine.compare(mockMatrix, aliasJob);

    // React.js should be resolved to canonical 'React' and match candidate's 'React'
    const reactMatch = report.strongMatches.find((m) => m.canonicalName === "React");
    expect(reactMatch).toBeDefined();
    expect(reactMatch?.status).toBe("MATCH");

    // K8s should be resolved to canonical 'Kubernetes'
    const k8sItem = report.optionalGaps.find((o) => o.canonicalName === "Kubernetes");
    expect(k8sItem).toBeDefined();
  });

  it("does not claim a skill is missing if credible evidence exists (Rule: evidence prevents false missing)", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    // Candidate has PostgreSQL in matrix with 1 strong project evidence
    const postgresItem = report.strongMatches.find((m) => m.canonicalName === "PostgreSQL");
    expect(postgresItem).toBeDefined();
    expect(postgresItem?.candidateProficiency).not.toBe("Not Detected");
    expect(postgresItem?.evidenceCount).toBeGreaterThan(0);
    expect(postgresItem?.status).not.toBe("GAP");
  });

  it("computes deterministic alignment score and generates comprehensive explanation", () => {
    const report = gapEngine.compare(mockMatrix, mockJob);

    expect(report.summary.alignmentScore).toBeGreaterThan(0);
    expect(report.summary.alignmentScore).toBeLessThanOrEqual(100);
    expect(["Strong", "Moderate", "Developing", "Low"]).toContain(report.summary.alignmentRating);
    expect(report.summary.alignmentExplanation).toContain("Linear Systems");
    expect(report.summary.criticalGapCount).toBe(1); // Docker
    expect(report.summary.matchCount).toBe(3); // React, TypeScript, PostgreSQL
    expect(report.summary.partialCount).toBe(1); // Python
    expect(report.summary.weakEvidenceCount).toBe(1); // GraphQL
    expect(report.summary.optionalGapCount).toBe(1); // Kubernetes
  });

  it("provides full HTTP API comparison flow via POST /api/v1/gap/compare", async () => {
    const response = await request(app)
      .post("/api/v1/gap/compare")
      .send({ matrix: mockMatrix, job: mockJob })
      .expect(200);

    expect(response.body.status).toBe("success");
    expect(response.body.data.targetRole).toBe("Senior Full Stack Engineer");
    expect(response.body.data.summary.totalRequired).toBe(5);
    expect(response.body.data.criticalGaps.length).toBe(1);
    expect(response.body.data.strongMatches.length).toBe(3);

    const reportId = response.body.data.id;

    // Retrieve via GET /api/v1/gap/:id
    const getRes = await request(app).get(`/api/v1/gap/${reportId}`).expect(200);
    expect(getRes.body.status).toBe("success");
    expect(getRes.body.data.id).toBe(reportId);

    // Retrieve via GET /api/v1/gap/latest
    const latestRes = await request(app).get("/api/v1/gap/latest").expect(200);
    expect(latestRes.body.status).toBe("success");
    expect(latestRes.body.data.id).toBe(reportId);
  });

  it("handles missing inputs and non-existent IDs with appropriate status codes", async () => {
    // Missing body
    await request(app)
      .post("/api/v1/gap/compare")
      .send({})
      .expect(400);

    // Non-existent ID lookup
    await request(app)
      .get("/api/v1/gap/non-existent-uuid-12345")
      .expect(404);
  });
});
