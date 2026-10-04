import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { githubEvidenceRepository } from "../github.repository.js";

describe("Phase 11: GitHub Evidence API Integration", () => {
  beforeEach(() => {
    githubEvidenceRepository.clear();
  });

  const mockResume = {
    id: "res-test-alex",
    fileName: "Alex_Resume.pdf",
    fileType: "pdf" as const,
    fileSizeBytes: 120000,
    rawText: "Alex Rivera | Docker, AWS, React, Node.js, TypeScript",
    profile: {
      name: "Alex Rivera",
      githubUrl: "https://github.com/alexrivera-dev",
    },
    skillsClaimed: ["React", "Node.js", "Docker", "AWS", "Testing"],
    projects: [
      {
        name: "DevPulse",
        technologies: ["React", "Node.js", "Docker"],
        bullets: ["Built with Docker"],
      },
    ],
    experience: [],
    education: [],
    certifications: [],
    achievements: [],
    parsedAt: new Date().toISOString(),
  };

  it("GET /api/v1/github/status returns valid status object", async () => {
    const res = await request(app).get("/api/v1/github/status");
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("demo");
    expect(typeof res.body.connected).toBe("boolean");
  });

  it("POST /api/v1/github/sync returns repository signals and analysis", async () => {
    const res = await request(app).post("/api/v1/github/sync").send({
      username: "alexrivera-dev",
      resume: mockResume,
    });

    expect(res.status).toBe(200);
    expect(res.body.repositoriesAnalyzed).toBeGreaterThanOrEqual(1);
    expect(res.body.evidence).toBeDefined();
    expect(res.body.report).toBeDefined();
  });

  it("POST /api/v1/github/connect connects via authorized API flow and compares against resume", async () => {
    const res = await request(app).post("/api/v1/github/connect").send({
      username: "alexrivera-dev",
      resume: mockResume,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");

    const report = res.body.data;
    expect(report.username).toBe("alexrivera-dev");
    expect(report.analyzedRepositories.length).toBeGreaterThanOrEqual(2);

    // Docker verification
    const dockerComp = report.comparisons.find((c: any) => c.canonicalName === "Docker");
    expect(dockerComp).toBeDefined();
    expect(dockerComp.resumeEvidence).toBe(true);
    expect(dockerComp.githubEvidence).toBe(true);
    expect(dockerComp.status).toBe("VERIFIED");
    expect(dockerComp.confidence).toBe("High");
    expect(dockerComp.projectEvidence).toBe("Strong");

    // AWS discrepancy check
    const awsComp = report.comparisons.find((c: any) => c.canonicalName === "AWS");
    expect(awsComp).toBeDefined();
    expect(awsComp.status).toBe("DISCREPANCY");
    expect(awsComp.discrepancyMessage).toBe(
      "AWS is listed on your resume, but current connected evidence does not demonstrate it."
    );

    expect(report.discrepancies.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/v1/github/report/latest returns latest report", async () => {
    await request(app).post("/api/v1/github/connect").send({
      username: "alexrivera-dev",
      resume: mockResume,
    });

    const res = await request(app).get("/api/v1/github/report/latest");
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("alexrivera-dev");
  });

  it("GET /api/v1/github/repositories returns analyzed repositories list", async () => {
    const res = await request(app).get("/api/v1/github/repositories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
