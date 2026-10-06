import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { githubEvidenceRepository } from "../github.repository.js";
import { githubService } from "../github.service.js";
import type { AnalyzedRepository } from "@skilltwin/contracts";

describe("Phase 11: GitHub Evidence API Integration", () => {
  const testRepos: AnalyzedRepository[] = [
    {
      id: "1",
      name: "devpulse",
      fullName: "testuser/devpulse",
      htmlUrl: "https://github.com/testuser/devpulse",
      description: "DevPulse Service",
      primaryLanguage: "TypeScript",
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100 }],
      topics: ["docker", "react"],
      isFork: false,
      defaultBranch: "main",
      starsCount: 5,
      forksCount: 1,
      openIssuesCount: 0,
      updatedAt: new Date().toISOString(),
      pushedAt: new Date().toISOString(),
      activityLevel: "Active",
      structure: { hasSrc: true, hasTests: false, hasDocs: false, keyDirectories: ["src"] },
      dependencies: [],
      testing: { detected: false, frameworks: [], testDirectories: [], testFileCount: 0 },
      docker: { detected: true, hasDockerfile: true, hasDockerCompose: false, files: ["Dockerfile"] },
      deployment: { detected: false, platforms: [], configFiles: [] },
      detectedTechnologies: ["Docker", "TypeScript", "React"],
    },
    {
      id: "2",
      name: "cloudcart",
      fullName: "testuser/cloudcart",
      htmlUrl: "https://github.com/testuser/cloudcart",
      description: "CloudCart app",
      primaryLanguage: "JavaScript",
      languages: [{ name: "JavaScript", bytes: 8000, percentage: 100 }],
      topics: ["nodejs"],
      isFork: false,
      defaultBranch: "main",
      starsCount: 2,
      forksCount: 0,
      openIssuesCount: 0,
      updatedAt: new Date().toISOString(),
      pushedAt: new Date().toISOString(),
      activityLevel: "Active",
      structure: { hasSrc: true, hasTests: false, hasDocs: false, keyDirectories: ["src"] },
      dependencies: [],
      testing: { detected: false, frameworks: [], testDirectories: [], testFileCount: 0 },
      docker: { detected: false, hasDockerfile: false, hasDockerCompose: false, files: [] },
      deployment: { detected: false, platforms: [], configFiles: [] },
      detectedTechnologies: ["Node.js", "JavaScript"],
    },
  ];

  beforeEach(() => {
    githubEvidenceRepository.clear();
    vi.spyOn(githubService, "fetchRepositories").mockResolvedValue(testRepos);
  });

  const mockResume = {
    id: "res-test-candidate",
    fileName: "Candidate_Resume.pdf",
    fileType: "pdf" as const,
    fileSizeBytes: 120000,
    rawText: "Candidate | Docker, AWS, React, Node.js, TypeScript",
    profile: {
      name: "Test Candidate",
      githubUrl: "https://github.com/testuser",
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
      username: "testuser",
      resume: mockResume,
    });

    expect(res.status).toBe(200);
    expect(res.body.repositoriesAnalyzed).toBeGreaterThanOrEqual(1);
    expect(res.body.evidence).toBeDefined();
    expect(res.body.report).toBeDefined();
  });

  it("POST /api/v1/github/connect connects via authorized API flow and compares against resume", async () => {
    const res = await request(app).post("/api/v1/github/connect").send({
      username: "testuser",
      resume: mockResume,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");

    const report = res.body.data;
    expect(report.username).toBe("testuser");
    expect(report.analyzedRepositories.length).toBeGreaterThanOrEqual(2);

    // Docker verification
    const dockerComp = report.comparisons.find((c: any) => c.canonicalName === "Docker");
    expect(dockerComp).toBeDefined();
    expect(dockerComp.resumeEvidence).toBe(true);
    expect(dockerComp.githubEvidence).toBe(true);
    expect(dockerComp.status).toBe("VERIFIED");
    expect(dockerComp.confidence).toBe("Moderate");
    expect(dockerComp.projectEvidence).toBe("Moderate");

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
      username: "testuser",
      resume: mockResume,
    });

    const res = await request(app).get("/api/v1/github/report/latest");
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("testuser");
  });

  it("GET /api/v1/github/repositories returns analyzed repositories list", async () => {
    await request(app).post("/api/v1/github/connect").send({
      username: "testuser",
      resume: mockResume,
    });

    const res = await request(app).get("/api/v1/github/repositories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
