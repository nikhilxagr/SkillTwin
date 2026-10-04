import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { JobTailoringEngine } from "../tailoring.engine.js";
import { optimizerRepository } from "../optimizer.repository.js";
import { resumeRepository } from "../../resume/resume.repository.js";
import { jobRepository } from "../../job/job.repository.js";
import { GapEngine } from "../../gap/gap.engine.js";
import { jobSpecificTailoredResumeSchema } from "@skilltwin/contracts";
import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
} from "@skilltwin/contracts";

describe("JobTailoringEngine (Phase 7: Job-Specific Resume Workflow)", () => {
  let engine: JobTailoringEngine;
  let gapEngine: GapEngine;

  const mockMasterResume: ResumeExtraction = {
    id: "master-resume-phase7",
    fileName: "alex_master_resume.pdf",
    fileType: "pdf",
    fileSizeBytes: 124500,
    rawText: `Alex Rivera
Senior Full Stack Engineer
Skills: TypeScript, React, Node.js, Go, Docker, PostgreSQL, Redis, jQuery, SVN
Experience:
Senior Software Engineer at Nexus Systems (2021 - Present)
- worked on distributed backend microservices and gRPC APIs
- helped team implement React dashboards for cluster monitoring
- attended daily standups and sent weekly status emails
Projects:
Legacy CMS
- Maintained internal intranet tools with PHP and jQuery
Cloud Cluster Orchestrator
- Engineered high-concurrency scheduling tool with Go, Docker, and Redis`,
    profile: {
      name: "Alex Rivera",
      email: "alex@example.com",
      summary: "Full Stack Engineer building web applications and backend systems.",
      yearsOfExperienceEstimate: 5,
    },
    skillsClaimed: ["TypeScript", "React", "Node.js", "Go", "Docker", "PostgreSQL", "Redis", "jQuery", "SVN"],
    experience: [
      {
        company: "Nexus Systems",
        role: "Senior Software Engineer",
        startDate: "2021-03-01",
        current: true,
        technologies: ["Go", "Docker", "Redis", "React"],
        bullets: [
          "worked on distributed backend microservices and gRPC APIs",
          "helped team implement React dashboards for cluster monitoring",
          "attended daily standups and sent weekly status emails",
        ],
      },
    ],
    projects: [
      {
        name: "Legacy CMS",
        description: "Maintained internal intranet tools with PHP and jQuery.",
        technologies: ["PHP", "jQuery"],
        bullets: ["Supported legacy user management screens."],
      },
      {
        name: "Cloud Cluster Orchestrator",
        description: "Engineered high-concurrency scheduling tool with Go, Docker, and Redis.",
        technologies: ["Go", "Docker", "Redis"],
        bullets: ["Engineered containerized scheduler handling concurrent task queues."],
      },
    ],
    education: [
      {
        institution: "State University",
        degree: "B.S. in Computer Science",
        startDate: "2016-09-01",
        endDate: "2020-05-01",
      },
    ],
    certifications: [],
    achievements: [],
    parsedAt: new Date().toISOString(),
  };

  const mockTargetJob: JobExtraction = {
    id: "job-target-phase7",
    title: "Senior Distributed Systems Engineer",
    company: "CloudScale Inc",
    rawText: "We need a Senior Distributed Systems Engineer skilled in Go, Docker, Kubernetes, and Redis.",
    requiredSkills: [
      {
        canonicalName: "Go",
        category: "Programming Languages",
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
        canonicalName: "Kubernetes",
        category: "Cloud",
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
        canonicalName: "PostgreSQL",
        category: "Database",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
      },
    ],
    responsibilities: [
      "Architect and scale distributed containerized microservices",
      "Optimize Redis caching and high-throughput pipelines",
    ],
    keywords: {
      programmingLanguages: ["Go", "TypeScript"],
      frameworks: [],
      libraries: ["gRPC"],
      databases: ["Redis", "PostgreSQL"],
      tools: ["Docker"],
      cloudDevOps: ["Kubernetes", "Docker"],
      cybersecurity: [],
      softSkills: [],
      generalKeywords: [],
      technicalSkills: ["Distributed Systems", "Microservices"],
    },
    qualifications: ["B.S. in Computer Science"],
    experience: {
      minYears: 4,
      level: "Senior",
    },
    parsedAt: new Date().toISOString(),
  };

  const mockMatrix: SkillMatrix = {
    resumeId: "master-resume-phase7",
    generatedAt: new Date().toISOString(),
    summary: {
      totalSkills: 5,
      demonstratedCount: 4,
      claimedOnlyCount: 1,
      weakEvidenceCount: 0,
      averageConfidence: 80,
      topSkills: ["Go", "Docker", "Redis"],
    },
    items: [
      {
        canonicalName: "Go",
        category: "Programming Languages",
        aliases: ["Golang"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-go-1",
            sourceType: "work_experience",
            context: "worked on distributed backend microservices and gRPC APIs",
            weight: 90,
            verified: true,
          },
        ],
        explanation: "Verified Go microservices.",
        missingEvidence: [],
        relatedSkills: ["Docker"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Docker",
        category: "Cloud/DevOps",
        aliases: ["Containerization"],
        proficiency: "Strong",
        confidence: 88,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-docker-1",
            sourceType: "project",
            context: "Engineered containerized scheduler handling concurrent task queues",
            weight: 88,
            verified: true,
          },
        ],
        explanation: "Verified Docker containerization.",
        missingEvidence: [],
        relatedSkills: ["Go"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Redis",
        category: "Database",
        aliases: ["In-Memory Cache"],
        proficiency: "Intermediate",
        confidence: 85,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-redis-1",
            sourceType: "project",
            context: "high-concurrency scheduling tool with Go, Docker, and Redis",
            weight: 85,
            verified: true,
          },
        ],
        explanation: "Verified Redis implementation.",
        missingEvidence: [],
        relatedSkills: ["PostgreSQL"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["ReactJS"],
        proficiency: "Intermediate",
        confidence: 82,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-react-1",
            sourceType: "work_experience",
            context: "helped team implement React dashboards for cluster monitoring",
            weight: 82,
            verified: true,
          },
        ],
        explanation: "Verified React dashboard implementation.",
        missingEvidence: [],
        relatedSkills: ["TypeScript"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "jQuery",
        category: "Frontend",
        aliases: [],
        proficiency: "Beginner",
        confidence: 30,
        evidenceLevel: "ClaimedOnly",
        evidence: [
          {
            id: "ev-jq-1",
            sourceType: "project",
            context: "Maintained internal intranet tools with PHP and jQuery",
            weight: 30,
            verified: false,
          },
        ],
        explanation: "Legacy jQuery maintenance.",
        missingEvidence: ["Modern framework evidence"],
        relatedSkills: [],
        claimed: true,
        demonstrated: false,
      },
    ],
  };

  beforeEach(() => {
    engine = new JobTailoringEngine();
    gapEngine = new GapEngine();
    optimizerRepository.clear();
    resumeRepository.clear();
    jobRepository.clear();

    resumeRepository.saveResume(mockMasterResume);
    resumeRepository.saveMatrix(mockMatrix);
    jobRepository.saveJob(mockTargetJob);
  });

  describe("Core Tailoring Engine Logic", () => {
    it("generates a schema-valid JobSpecificTailoredResume object", () => {
      const gapReport = gapEngine.compare(mockMatrix, mockTargetJob);
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
        gapReport,
      });

      expect(tailored).toBeDefined();
      expect(tailored.targetRole).toBe("Senior Distributed Systems Engineer");
      expect(tailored.company).toBe("CloudScale Inc");
      expect(tailored.masterResumeId).toBe("master-resume-phase7");

      const validation = jobSpecificTailoredResumeSchema.safeParse(tailored);
      expect(validation.success).toBe(true);
    });

    it("prioritizes relevant skills and elevates core target competencies", () => {
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
      });

      // Go and Docker are required in the target job
      const goSkill = tailored.prioritizedSkills.find((s) => s.skill === "Go");
      const dockerSkill = tailored.prioritizedSkills.find((s) => s.skill === "Docker");
      const jquerySkill = tailored.prioritizedSkills.find((s) => s.skill === "jQuery");

      expect(goSkill?.status).toBe("core_priority");
      expect(goSkill?.highlightTag).toBe("MATCHED");
      expect(dockerSkill?.status).toBe("core_priority");

      // jQuery is outdated / irrelevant for this modern distributed systems role
      expect(jquerySkill?.status).toBe("de_emphasized");
      expect(jquerySkill?.relevanceScore).toBeLessThan(40);

      // Skills are sorted so core_priority appears before de_emphasized
      const goIndex = tailored.prioritizedSkills.findIndex((s) => s.skill === "Go");
      const jqueryIndex = tailored.prioritizedSkills.findIndex((s) => s.skill === "jQuery");
      expect(goIndex).toBeLessThan(jqueryIndex);
    });

    it("prioritizes relevant projects and reorders them based on target stack", () => {
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
      });

      expect(tailored.prioritizedProjects.length).toBe(2);

      // Cloud Cluster Orchestrator (Go, Docker, Redis) matches target job and should be rank #1
      const orchestrator = tailored.prioritizedProjects.find(
        (p) => p.projectName === "Cloud Cluster Orchestrator"
      );
      const legacyCms = tailored.prioritizedProjects.find(
        (p) => p.projectName === "Legacy CMS"
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator?.tailoredRank).toBe(1);
      expect(orchestrator?.status).toBe("prioritized");

      // Legacy CMS is de-emphasized
      expect(legacyCms?.tailoredRank).toBe(2);
      expect(legacyCms?.status).toBe("de_emphasized");
    });

    it("improves relevant bullet points and flags administrative filler", () => {
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
      });

      // Improved passive bullet "worked on distributed backend microservices"
      const improvedBullet = tailored.tailoredBullets.find((b) =>
        b.originalBullet.includes("distributed backend microservices")
      );
      expect(improvedBullet).toBeDefined();
      expect(improvedBullet?.status).toBe("improved");
      expect(improvedBullet?.tailoredBullet).toMatch(/^Engineered/);

      // Flagged administrative bullet "attended daily standups"
      const adminBullet = tailored.tailoredBullets.find((b) =>
        b.originalBullet.includes("attended daily standups")
      );
      expect(adminBullet?.status).toBe("de_emphasized");
    });

    it("identifies missing evidence transparently with zero fabrication", () => {
      const gapReport = gapEngine.compare(mockMatrix, mockTargetJob);
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
        gapReport,
      });

      // Kubernetes is required by CloudScale Inc but absent from Alex's Master Profile
      const k8sNotice = tailored.missingEvidenceNotices.find(
        (n) => n.jobRequirement.toLowerCase() === "kubernetes"
      );
      expect(k8sNotice).toBeDefined();
      expect(k8sNotice?.evidenceState).toBe("MISSING");
      expect(k8sNotice?.importance).toBe("Required");
      expect(k8sNotice?.truthfulGuidance).toContain("Do not fabricate");
    });

    it("generates an Alignment Summary showing why the tailored version is better aligned", () => {
      const gapReport = gapEngine.compare(mockMatrix, mockTargetJob);
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
        gapReport,
      });

      const summary = tailored.alignmentSummary;
      expect(summary).toBeDefined();
      expect(summary.headline).toContain("Senior Distributed Systems Engineer");
      expect(summary.matchScoreTailored).toBeGreaterThan(summary.matchScoreOriginal);
      expect(summary.skillsPrioritizedCount).toBeGreaterThan(0);
      expect(summary.keyStrategicReasons.length).toBeGreaterThanOrEqual(3);
      expect(summary.detailedRationale).toContain("Master Resume");
    });

    it("strictly preserves zero-fabrication rules across all guarantees", () => {
      const tailored = engine.tailor({
        resume: mockMasterResume,
        matrix: mockMatrix,
        job: mockTargetJob,
      });

      expect(tailored.truthfulGuarantees.length).toBeGreaterThanOrEqual(4);
      for (const b of tailored.tailoredBullets) {
        // No made-up 40% performance numbers
        expect(b.tailoredBullet).not.toContain("40%");
        expect(b.truthCheckNote).toBeDefined();
      }
    });
  });

  describe("API Integration (Phase 7 Endpoints)", () => {
    it("POST /api/v1/optimizer/tailor generates and stores a tailored resume recommendation", async () => {
      const res = await request(app)
        .post("/api/v1/optimizer/tailor")
        .send({
          resumeId: "master-resume-phase7",
          jobId: "job-target-phase7",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id).toMatch(/^tailor-/);
      expect(res.body.data.targetRole).toBe("Senior Distributed Systems Engineer");
      expect(res.body.data.alignmentSummary).toBeDefined();
      expect(res.body.data.alignmentSummary.matchScoreTailored).toBeGreaterThan(
        res.body.data.alignmentSummary.matchScoreOriginal
      );
    });

    it("GET /api/v1/optimizer/tailored/latest returns the most recently tailored resume", async () => {
      await request(app)
        .post("/api/v1/optimizer/tailor")
        .send({
          resumeId: "master-resume-phase7",
          jobId: "job-target-phase7",
        });

      const getRes = await request(app).get("/api/v1/optimizer/tailored/latest");
      expect(getRes.status).toBe(200);
      expect(getRes.body.status).toBe("success");
      expect(getRes.body.data.targetRole).toBe("Senior Distributed Systems Engineer");
    });

    it("GET /api/v1/optimizer/tailored/:id returns 404 for unknown IDs", async () => {
      const res = await request(app).get("/api/v1/optimizer/tailored/unknown-id-12345");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
