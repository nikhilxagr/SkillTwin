import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { projectRepository } from "../projects.repository.js";

describe("Phase 10: Projects API Integration", () => {
  beforeEach(() => {
    projectRepository.clear();
  });

  const mockPayload = {
    matrix: {
      resumeId: "res-1",
      generatedAt: new Date().toISOString(),
      summary: {
        totalSkills: 2,
        demonstratedCount: 2,
        claimedOnlyCount: 0,
        weakEvidenceCount: 0,
        averageConfidence: 90,
        topSkills: ["React", "Node.js"],
      },
      items: [
        {
          canonicalName: "React",
          category: "Frontend",
          aliases: ["React.js"],
          proficiency: "Strong",
          confidence: 92,
          evidenceLevel: "Demonstrated",
          evidence: [],
          explanation: "Production experience.",
          missingEvidence: [],
          relatedSkills: [],
          claimed: true,
          demonstrated: true,
        },
        {
          canonicalName: "Node.js",
          category: "Backend",
          aliases: ["Node"],
          proficiency: "Strong",
          confidence: 88,
          evidenceLevel: "Demonstrated",
          evidence: [],
          explanation: "Backend service experience.",
          missingEvidence: [],
          relatedSkills: [],
          claimed: true,
          demonstrated: true,
        },
      ],
    },
    gapReport: {
      id: "gap-1",
      resumeId: "res-1",
      jobId: "job-1",
      targetRole: "Senior Full-Stack Engineer",
      company: "CloudScale Inc",
      summary: {
        totalRequired: 4,
        totalPreferred: 1,
        matchCount: 2,
        partialCount: 1,
        criticalGapCount: 2,
        weakEvidenceCount: 0,
        optionalGapCount: 0,
        alignmentRating: "Moderate",
        alignmentScore: 65,
        alignmentExplanation: "Missing Docker containerization and Redis distributed cache.",
      },
      criticalGaps: [
        {
          canonicalName: "Docker",
          category: "DevOps",
          status: "GAP",
          importance: "Required",
          candidateProficiency: "Not Detected",
          requiredProficiency: "Strong",
          candidateConfidence: 0,
          evidenceCount: 0,
          evidenceSummary: "No Docker evidence.",
          gapRationale: "Must be able to containerize services.",
          suggestedAction: "Build a Docker project.",
          priority: "Critical",
          priorityScore: 95,
          priorityRationale: "High priority requirement.",
          relatedCandidateSkills: [],
        },
        {
          canonicalName: "Redis",
          category: "Database",
          status: "GAP",
          importance: "Required",
          candidateProficiency: "Not Detected",
          requiredProficiency: "Intermediate",
          candidateConfidence: 0,
          evidenceCount: 0,
          evidenceSummary: "No Redis evidence.",
          gapRationale: "Distributed caching required.",
          suggestedAction: "Implement Redis cache-aside.",
          priority: "Critical",
          priorityScore: 90,
          priorityRationale: "Required for low latency.",
          relatedCandidateSkills: [],
        },
      ],
      partialGaps: [
        {
          canonicalName: "Testing",
          category: "Testing",
          status: "PARTIAL",
          importance: "Required",
          candidateProficiency: "Beginner",
          requiredProficiency: "Strong",
          candidateConfidence: 30,
          evidenceCount: 1,
          evidenceSummary: "Few test claims.",
          gapRationale: "Need high coverage.",
          suggestedAction: "Add Vitest and Supertest.",
          priority: "High",
          priorityScore: 85,
          priorityRationale: "Quality assurance gap.",
          relatedCandidateSkills: [],
        },
        {
          canonicalName: "AWS",
          category: "Cloud",
          status: "PARTIAL",
          importance: "Required",
          candidateProficiency: "Beginner",
          requiredProficiency: "Intermediate",
          candidateConfidence: 25,
          evidenceCount: 1,
          evidenceSummary: "Basic cloud concepts.",
          gapRationale: "Production deployment target.",
          suggestedAction: "Deploy to AWS.",
          priority: "High",
          priorityScore: 80,
          priorityRationale: "Infrastructure gap.",
          relatedCandidateSkills: [],
        },
      ],
      weakEvidence: [],
      strongMatches: [],
      optionalGaps: [],
      generatedAt: new Date().toISOString(),
    },
  };

  it("POST /api/v1/projects/recommendations generates tailored projects targeting gaps", async () => {
    const res = await request(app)
      .post("/api/v1/projects/recommendations")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.targetRole).toBe("Senior Full-Stack Engineer");
    expect(res.body.data.targetedGapSkills).toContain("Docker");
    expect(res.body.data.targetedGapSkills).toContain("Redis");
    expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);

    const proj = res.body.data.projects[0];
    expect(proj.title).toContain("Production-Ready Task & Distributed Workflow Platform");
    expect(proj.skillsDemonstrated).toContain("Docker");
    expect(proj.skillsDemonstrated).toContain("Redis");
    expect(proj.skillsDemonstrated).toContain("Testing");
    expect(proj.skillsDemonstrated).toContain("AWS");
    expect(proj.architecture).toBeDefined();
    expect(proj.milestones.length).toBe(4);
    expect(proj.expectedEvidence.length).toBe(4);
  });

  it("GET /api/v1/projects/latest returns the most recent report", async () => {
    // Before generating
    const resEmpty = await request(app).get("/api/v1/projects/latest");
    expect(resEmpty.status).toBe(404);

    // Generate
    await request(app)
      .post("/api/v1/projects/recommendations")
      .send(mockPayload);

    // After generating
    const resSuccess = await request(app).get("/api/v1/projects/latest");
    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.data.projects.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/v1/projects/blueprint generates a detailed Project Blueprint", async () => {
    // Generate recommendations first
    const recRes = await request(app)
      .post("/api/v1/projects/recommendations")
      .send(mockPayload);

    const projectId = recRes.body.data.projects[0].id;

    // Generate blueprint
    const bpRes = await request(app)
      .post("/api/v1/projects/blueprint")
      .send({ projectId });

    expect(bpRes.status).toBe(200);
    expect(bpRes.body.status).toBe("success");
    expect(bpRes.body.data.projectId).toBe(projectId);
    expect(bpRes.body.data.systemTopology).toBeDefined();
    expect(bpRes.body.data.codeTemplates.length).toBeGreaterThanOrEqual(3);
    expect(bpRes.body.data.verificationChecklist.length).toBeGreaterThanOrEqual(3);
    expect(bpRes.body.data.resumeBulletPoints.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/v1/projects/blueprint/:projectId retrieves blueprint", async () => {
    await request(app)
      .post("/api/v1/projects/recommendations")
      .send(mockPayload);

    const res = await request(app).get("/api/v1/projects/blueprint/proj-workflow-platform");
    expect(res.status).toBe(200);
    expect(res.body.data.projectTitle).toContain("Production-Ready Task");
  });
});
