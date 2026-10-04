import { describe, it, expect } from "vitest";
import {
  compareGithubEvidence,
  githubEvidenceReportSchema,
  type AnalyzedRepository,
  type SkillMatrix,
} from "../index.js";

describe("Phase 11: GitHub Evidence Verification Engine", () => {
  const sampleMatrix: SkillMatrix = {
    resumeId: "res-test-1",
    generatedAt: new Date().toISOString(),
    summary: {
      totalSkills: 5,
      demonstratedCount: 4,
      claimedOnlyCount: 1,
      weakEvidenceCount: 0,
      averageConfidence: 85,
      topSkills: ["React", "Node.js", "Docker", "AWS", "Testing"],
    },
    items: [
      {
        canonicalName: "Docker",
        category: "DevOps",
        aliases: ["Container"],
        proficiency: "Strong",
        confidence: 85,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "Claimed containerization experience.",
        missingEvidence: [],
        relatedSkills: [],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "AWS",
        category: "Cloud",
        aliases: ["Amazon Web Services"],
        proficiency: "Intermediate",
        confidence: 60,
        evidenceLevel: "ClaimedOnly",
        evidence: [],
        explanation: "Claimed cloud deployment on AWS.",
        missingEvidence: ["No public infrastructure code"],
        relatedSkills: [],
        claimed: true,
        demonstrated: false,
      },
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["React.js"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "React components in projects.",
        missingEvidence: [],
        relatedSkills: [],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Testing",
        category: "Testing",
        aliases: ["Unit Testing"],
        proficiency: "Strong",
        confidence: 85,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "Authored automated tests.",
        missingEvidence: [],
        relatedSkills: [],
        claimed: true,
        demonstrated: true,
      },
    ],
  };

  const sampleRepos: AnalyzedRepository[] = [
    {
      id: "repo-1",
      name: "devpulse",
      fullName: "alexrivera-dev/devpulse",
      htmlUrl: "https://github.com/alexrivera-dev/devpulse",
      description: "Developer Metrics & Analytics Platform",
      primaryLanguage: "TypeScript",
      languages: [
        { name: "TypeScript", bytes: 45000, percentage: 75 },
        { name: "CSS", bytes: 15000, percentage: 25 },
      ],
      topics: ["react", "nodejs", "docker"],
      isFork: false,
      defaultBranch: "main",
      starsCount: 14,
      forksCount: 3,
      openIssuesCount: 1,
      updatedAt: "2026-10-01T12:00:00Z",
      pushedAt: "2026-10-01T14:30:00Z",
      activityLevel: "Active",
      structure: {
        hasSrc: true,
        hasTests: true,
        hasDocs: true,
        keyDirectories: ["src", "tests", ".github"],
      },
      dependencies: [
        { name: "react", version: "^18.2.0", category: "framework" },
        { name: "express", version: "^4.19.0", category: "framework" },
        { name: "vitest", version: "^1.5.0", category: "testing" },
      ],
      readmeSummary: "Full-stack dashboard with React 18, Node.js, and Docker Compose.",
      testing: {
        detected: true,
        frameworks: ["Vitest"],
        testFileCount: 12,
        testDirectories: ["tests"],
      },
      docker: {
        detected: true,
        hasDockerfile: true,
        hasDockerCompose: true,
        files: ["Dockerfile", "docker-compose.yml"],
      },
      deployment: {
        detected: true,
        platforms: ["GitHub Actions"],
        configFiles: [".github/workflows/ci.yml"],
      },
      detectedTechnologies: ["React", "TypeScript", "Node.js", "Docker", "Vitest", "GitHub Actions"],
    },
    {
      id: "repo-2",
      name: "task-workflow-engine",
      fullName: "alexrivera-dev/task-workflow-engine",
      htmlUrl: "https://github.com/alexrivera-dev/task-workflow-engine",
      description: "Distributed Background Job Queue",
      primaryLanguage: "TypeScript",
      languages: [
        { name: "TypeScript", bytes: 32000, percentage: 90 },
        { name: "JavaScript", bytes: 3500, percentage: 10 },
      ],
      topics: ["docker", "bullmq", "redis"],
      isFork: false,
      defaultBranch: "main",
      starsCount: 8,
      forksCount: 1,
      openIssuesCount: 0,
      updatedAt: "2026-09-25T10:00:00Z",
      pushedAt: "2026-09-25T11:00:00Z",
      activityLevel: "Steady",
      structure: {
        hasSrc: true,
        hasTests: true,
        hasDocs: false,
        keyDirectories: ["src", "__tests__"],
      },
      dependencies: [
        { name: "bullmq", version: "^5.1.0", category: "tool" },
        { name: "ioredis", version: "^5.3.0", category: "database" },
        { name: "vitest", version: "^1.5.0", category: "testing" },
      ],
      readmeSummary: "Asynchronous task queue running in containerized Docker services.",
      testing: {
        detected: true,
        frameworks: ["Vitest"],
        testFileCount: 6,
        testDirectories: ["__tests__"],
      },
      docker: {
        detected: true,
        hasDockerfile: true,
        hasDockerCompose: true,
        files: ["Dockerfile", "docker-compose.yml"],
      },
      deployment: {
        detected: false,
        platforms: [],
        configFiles: [],
      },
      detectedTechnologies: ["TypeScript", "Docker", "Redis", "BullMQ", "Vitest"],
    },
  ];

  it("should verify skills detected in GitHub repositories with high confidence", () => {
    const report = compareGithubEvidence({
      matrix: sampleMatrix,
      repositories: sampleRepos,
      username: "alexrivera-dev",
    });

    const dockerResult = report.comparisons.find((c) => c.canonicalName === "Docker");
    expect(dockerResult).toBeDefined();
    expect(dockerResult?.resumeEvidence).toBe(true);
    expect(dockerResult?.resumeEvidenceDetail).toBe("Yes");
    expect(dockerResult?.githubEvidence).toBe(true);
    expect(dockerResult?.githubEvidenceDetail).toContain("Docker detected in 2 repositories");
    expect(dockerResult?.projectEvidence).toBe("Strong");
    expect(dockerResult?.confidence).toBe("High");
    expect(dockerResult?.status).toBe("VERIFIED");
  });

  it("should respectfully detect discrepancies when resume claims a skill with no connected evidence", () => {
    const report = compareGithubEvidence({
      matrix: sampleMatrix,
      repositories: sampleRepos,
      username: "alexrivera-dev",
    });

    const awsResult = report.comparisons.find((c) => c.canonicalName === "AWS");
    expect(awsResult).toBeDefined();
    expect(awsResult?.resumeEvidence).toBe(true);
    expect(awsResult?.githubEvidence).toBe(false);
    expect(awsResult?.status).toBe("DISCREPANCY");
    expect(awsResult?.confidence).toBe("Low");

    // Exact phrasing constraint: Do not accuse the user of lying.
    expect(awsResult?.discrepancyMessage).toBe(
      "AWS is listed on your resume, but current connected evidence does not demonstrate it."
    );
  });

  it("should identify GitHub-only skills detected in code but omitted from resume", () => {
    const report = compareGithubEvidence({
      matrix: sampleMatrix,
      repositories: sampleRepos,
      username: "alexrivera-dev",
    });

    const bullmq = report.comparisons.find((c) => c.canonicalName === "BullMQ");
    expect(bullmq).toBeDefined();
    expect(bullmq?.status).toBe("GITHUB_ONLY");
    expect(bullmq?.resumeEvidence).toBe(false);
    expect(bullmq?.githubEvidence).toBe(true);
  });

  it("should validate against the Zod schema cleanly", () => {
    const report = compareGithubEvidence({
      matrix: sampleMatrix,
      repositories: sampleRepos,
      username: "alexrivera-dev",
    });

    const parsed = githubEvidenceReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });
});
