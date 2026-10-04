import { describe, it, expect } from "vitest";
import {
  generateProjectRecommendations,
  generateProjectBlueprint,
  projectRecommendationReportSchema,
  projectBlueprintSchema,
  type GapAnalysisReport,
  type SkillMatrix,
  type JobExtraction,
} from "../index.js";

describe("Phase 10: Project Recommendation Engine", () => {
  const sampleMatrix: SkillMatrix = {
    resumeId: "resume-demo-1",
    generatedAt: new Date().toISOString(),
    summary: {
      totalSkills: 3,
      demonstratedCount: 3,
      claimedOnlyCount: 0,
      weakEvidenceCount: 0,
      averageConfidence: 88,
      topSkills: ["React", "Node.js", "TypeScript"],
    },
    items: [
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["React.js"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "Verified React proficiency in projects.",
        missingEvidence: [],
        relatedSkills: ["JavaScript", "TypeScript"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Node.js",
        category: "Backend",
        aliases: ["Node"],
        proficiency: "Strong",
        confidence: 85,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "Verified Node.js proficiency.",
        missingEvidence: [],
        relatedSkills: ["Express", "TypeScript"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "TypeScript",
        category: "Programming Languages",
        aliases: ["TS"],
        proficiency: "Strong",
        confidence: 88,
        evidenceLevel: "Demonstrated",
        evidence: [],
        explanation: "Verified TypeScript proficiency.",
        missingEvidence: [],
        relatedSkills: ["JavaScript"],
        claimed: true,
        demonstrated: true,
      },
    ],
  };

  const sampleGapReport: GapAnalysisReport = {
    id: "gap-demo-1",
    resumeId: "resume-demo-1",
    jobId: "job-demo-1",
    targetRole: "Staff Backend Engineer",
    company: "Acme Cloud",
    summary: {
      totalRequired: 6,
      totalPreferred: 2,
      matchCount: 2,
      partialCount: 1,
      criticalGapCount: 3,
      weakEvidenceCount: 1,
      optionalGapCount: 0,
      alignmentRating: "Developing",
      alignmentScore: 58,
      alignmentExplanation: "Missing critical containerization, distributed caching, and test evidence.",
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
        evidenceSummary: "No Dockerfile or container configs found in profile.",
        gapRationale: "Core requirement for deployment.",
        suggestedAction: "Build a containerized project.",
        priority: "Critical",
        priorityScore: 95,
        priorityRationale: "Critical deployment requirement.",
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
        evidenceSummary: "No caching or Redis usage detected.",
        gapRationale: "Needed for high-throughput distributed caching.",
        suggestedAction: "Implement cache-aside layer.",
        priority: "Critical",
        priorityScore: 90,
        priorityRationale: "Required for distributed session and cache.",
        relatedCandidateSkills: [],
      },
      {
        canonicalName: "Testing",
        category: "Testing",
        status: "GAP",
        importance: "Required",
        candidateProficiency: "Beginner",
        requiredProficiency: "Strong",
        candidateConfidence: 20,
        evidenceCount: 1,
        evidenceSummary: "Claimed testing knowledge but minimal repository test fixtures.",
        gapRationale: "Need proof of unit, integration, and E2E coverage.",
        suggestedAction: "Author automated test suites.",
        priority: "High",
        priorityScore: 85,
        priorityRationale: "Strong gap in automated testing proof.",
        relatedCandidateSkills: [],
      },
    ],
    partialGaps: [
      {
        canonicalName: "AWS",
        category: "Cloud",
        status: "PARTIAL",
        importance: "Required",
        candidateProficiency: "Beginner",
        requiredProficiency: "Intermediate",
        candidateConfidence: 35,
        evidenceCount: 1,
        evidenceSummary: "Basic familiarity without production deployment proof.",
        gapRationale: "Target job requires ECS / S3 deployment experience.",
        suggestedAction: "Deploy container to AWS.",
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
  };

  it("should generate grounded project recommendations targeting user's specific gaps", () => {
    const report = generateProjectRecommendations({
      matrix: sampleMatrix,
      gapReport: sampleGapReport,
    });

    expect(report.targetRole).toBe("Staff Backend Engineer");
    expect(report.targetedGapSkills).toContain("Docker");
    expect(report.targetedGapSkills).toContain("Redis");
    expect(report.targetedGapSkills).toContain("Testing");
    expect(report.targetedGapSkills).toContain("AWS");

    // Must have at least 1 project, specifically a production-ready task management platform
    expect(report.projects.length).toBeGreaterThanOrEqual(1);

    const primaryProject = report.projects[0];
    expect(primaryProject.title).toContain("Production-Ready Task & Distributed Workflow Platform");
    expect(primaryProject.difficulty).toBe("Production-Grade");

    // Skills demonstrated should combine existing strengths + missing gaps
    expect(primaryProject.skillsDemonstrated).toContain("React");
    expect(primaryProject.skillsDemonstrated).toContain("Node.js");
    expect(primaryProject.skillsDemonstrated).toContain("Docker");
    expect(primaryProject.skillsDemonstrated).toContain("Redis");
    expect(primaryProject.skillsDemonstrated).toContain("Testing");
    expect(primaryProject.skillsDemonstrated).toContain("AWS");

    // Must have features, architecture, milestones, and expected evidence
    expect(primaryProject.features.length).toBeGreaterThanOrEqual(4);
    expect(primaryProject.architecture.components.length).toBeGreaterThanOrEqual(3);
    expect(primaryProject.architecture.dataFlow.length).toBeGreaterThanOrEqual(4);
    expect(primaryProject.milestones.length).toBe(4);
    expect(primaryProject.expectedEvidence.length).toBe(4);

    // Validate with Zod schema
    const parsed = projectRecommendationReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it("should generate an in-depth Project Blueprint with code templates and verification checklist", () => {
    const report = generateProjectRecommendations({
      matrix: sampleMatrix,
      gapReport: sampleGapReport,
    });

    const primaryProject = report.projects[0];
    const blueprint = generateProjectBlueprint(primaryProject);

    expect(blueprint.projectId).toBe(primaryProject.id);
    expect(blueprint.projectTitle).toBe(primaryProject.title);
    expect(blueprint.systemTopology.length).toBeGreaterThan(20);
    expect(blueprint.apiEndpoints.length).toBeGreaterThanOrEqual(3);
    expect(blueprint.databaseSchemaDraft.length).toBeGreaterThanOrEqual(1);
    expect(blueprint.codeTemplates.length).toBeGreaterThanOrEqual(3);

    // Should include a Dockerfile and docker-compose
    const filenames = blueprint.codeTemplates.map((c) => c.filename);
    expect(filenames).toContain("Dockerfile");
    expect(filenames).toContain("docker-compose.yml");

    // Should include verification checklist and resume bullets
    expect(blueprint.verificationChecklist.length).toBeGreaterThanOrEqual(3);
    expect(blueprint.resumeBulletPoints.length).toBeGreaterThanOrEqual(2);

    // Validate with Zod schema
    const parsed = projectBlueprintSchema.safeParse(blueprint);
    expect(parsed.success).toBe(true);
  });
});
