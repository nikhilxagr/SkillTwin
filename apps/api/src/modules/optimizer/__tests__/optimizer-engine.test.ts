import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { ResumeOptimizerEngine } from "../optimizer.engine.js";
import { optimizerRepository } from "../optimizer.repository.js";
import { resumeRepository } from "../../resume/resume.repository.js";
import { jobRepository } from "../../job/job.repository.js";
import { gapRepository } from "../../gap/gap.repository.js";
import { GapEngine } from "../../gap/gap.engine.js";
import { resumeOptimizationReportSchema } from "@skilltwin/contracts";
import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  GapAnalysisReport,
} from "@skilltwin/contracts";

describe("ResumeOptimizerEngine (Phase 6)", () => {
  let engine: ResumeOptimizerEngine;
  let gapEngine: GapEngine;

  const mockResume: ResumeExtraction = {
    id: "resume-opt-test-01",
    fileName: "alex_resume.pdf",
    fileType: "pdf",
    fileSizeBytes: 104200,
    rawText: `Alex Dev
Email: alex@example.com
Full Stack Engineer with experience building web applications.
Technical Skills: JavaScript, TypeScript, React, Node.js, Express, Docker, PostgreSQL, Redis.
Experience:
Senior Frontend Developer at TechCorp (2022 - Present)
- Worked on React frontend application and Node.js microservices.
- Built reusable UI components and handled API integrations.
Projects:
DevPlatform (2023)
- Built developer dashboard using React, TypeScript, and Node.js.
Education:
B.S. in Computer Science from State University`,
    profile: {
      name: "Alex Dev",
      email: "alex@example.com",
      summary: "Full Stack Engineer with experience building web applications.",
      yearsOfExperienceEstimate: 3,
    },
    skillsClaimed: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "Docker", "PostgreSQL", "Redis"],
    experience: [
      {
        company: "TechCorp",
        role: "Senior Frontend Developer",
        startDate: "2022-01-01",
        current: true,
        technologies: ["React", "Node.js", "JavaScript"],
        bullets: [
          "Worked on React frontend application and Node.js microservices.",
          "Built reusable UI components and handled API integrations.",
        ],
      },
    ],
    projects: [
      {
        name: "DevPlatform",
        role: "Lead Developer",
        description: "Full-stack developer platform with dashboard and telemetry.",
        technologies: ["React", "TypeScript", "Node.js"],
        bullets: ["Built developer dashboard using React, TypeScript, and Node.js."],
      },
    ],
    education: [
      {
        institution: "State University",
        degree: "B.S. in Computer Science",
        fieldOfStudy: "Computer Science",
      },
    ],
    certifications: [],
    achievements: [],
    parsedAt: new Date().toISOString(),
  };

  const mockMatrix: SkillMatrix = {
    resumeId: "resume-opt-test-01",
    generatedAt: new Date().toISOString(),
    summary: {
      totalSkills: 4,
      demonstratedCount: 3,
      claimedOnlyCount: 1,
      weakEvidenceCount: 1,
      averageConfidence: 74,
      topSkills: ["TypeScript", "React", "Node.js"],
    },
    items: [
      {
        canonicalName: "TypeScript",
        category: "Languages",
        aliases: ["TS"],
        proficiency: "Strong",
        confidence: 90,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-ts-1",
            sourceType: "project",
            context: "Built developer dashboard using React, TypeScript, and Node.js.",
            weight: 90,
            verified: true,
          },
        ],
        explanation: "Verified TypeScript implementation.",
        missingEvidence: [],
        relatedSkills: ["React"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "React",
        category: "Frontend",
        aliases: ["React.js", "ReactJS"],
        proficiency: "Strong",
        confidence: 92,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-react-1",
            sourceType: "work_experience",
            context: "Worked on React frontend application and Node.js microservices.",
            weight: 95,
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
        canonicalName: "Node.js",
        category: "Backend",
        aliases: ["Node", "NodeJS"],
        proficiency: "Intermediate",
        confidence: 80,
        evidenceLevel: "Demonstrated",
        evidence: [
          {
            id: "ev-node-1",
            sourceType: "work_experience",
            context: "Worked on React frontend application and Node.js microservices.",
            weight: 80,
            verified: true,
          },
        ],
        explanation: "Demonstrated Node.js microservices.",
        missingEvidence: [],
        relatedSkills: ["Express"],
        claimed: true,
        demonstrated: true,
      },
      {
        canonicalName: "Docker",
        category: "Cloud/DevOps",
        aliases: ["Containerization"],
        proficiency: "Beginner",
        confidence: 35,
        evidenceLevel: "ClaimedOnly",
        evidence: [
          {
            id: "ev-docker-1",
            sourceType: "skills_section",
            context: "Technical Skills: Docker",
            weight: 30,
            verified: false,
          },
        ],
        explanation: "Superficially mentioned without container pipeline evidence.",
        missingEvidence: ["Container deployment pipeline in experience bullets"],
        relatedSkills: ["Kubernetes"],
        claimed: true,
        demonstrated: false,
      },
    ],
  };


  const mockJob: JobExtraction = {
    id: "job-opt-test-01",
    title: "Senior Full Stack Engineer",
    company: "CloudScale Systems",
    rawText: `Senior Full Stack Engineer at CloudScale Systems.
We require strong proficiency in TypeScript, React, and Kubernetes.
Experience with Node.js and GraphQL is required.
AWS and Docker experience is preferred.`,
    experience: {
      level: "Senior",
      minYears: 4,
      description: "4+ years building production applications.",
    },
    requiredSkills: [
      {
        canonicalName: "TypeScript",
        category: "Languages",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Strong proficiency in TypeScript required.",
      },
      {
        canonicalName: "React",
        category: "Frontend",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Modern React state management and hooks required.",
      },
      {
        canonicalName: "Kubernetes",
        category: "Cloud/DevOps",
        importance: "Required",
        minimumProficiency: "Intermediate",
        contextSentence: "Must have hands-on experience deploying to Kubernetes.",
      },
      {
        canonicalName: "Node.js",
        category: "Backend",
        importance: "Required",
        minimumProficiency: "Strong",
        contextSentence: "Node.js REST and event-driven architecture.",
      },
    ],
    preferredSkills: [
      {
        canonicalName: "Docker",
        category: "Cloud/DevOps",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
        contextSentence: "Docker containerization preferred.",
      },
      {
        canonicalName: "AWS",
        category: "Cloud/DevOps",
        importance: "Preferred",
        minimumProficiency: "Intermediate",
        contextSentence: "Familiarity with AWS services preferred.",
      },
    ],
    responsibilities: [
      "Architect and scale full-stack web applications.",
      "Manage cloud deployments and maintain automated CI/CD.",
    ],
    qualifications: ["B.S. in Computer Science or equivalent practical experience."],
    keywords: {
      programmingLanguages: ["TypeScript", "JavaScript"],
      frameworks: ["React", "Node.js"],
      libraries: ["Express"],
      databases: ["PostgreSQL", "Redis"],
      tools: ["Git"],
      cloudDevOps: ["Kubernetes", "Docker", "AWS"],
      cybersecurity: [],
      softSkills: ["Mentorship", "System Design"],
      generalKeywords: ["Full Stack", "Distributed Systems"],
      technicalSkills: [],
      cloud: [],
    },
    parsedAt: new Date().toISOString(),
  };

  let mockGapReport: GapAnalysisReport;

  beforeEach(() => {
    engine = new ResumeOptimizerEngine();
    gapEngine = new GapEngine();
    mockGapReport = gapEngine.compare(mockMatrix, mockJob);
    optimizerRepository.clear();
    resumeRepository.clear();
    jobRepository.clear();
    gapRepository.clear();

    resumeRepository.saveResume(mockResume);
    resumeRepository.saveMatrix(mockMatrix);
    jobRepository.saveJob(mockJob);
    gapRepository.saveReport(mockGapReport);
  });

  it("generates a complete optimization report validating the contract schema", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    const parsed = resumeOptimizationReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
    expect(report.targetRole).toBe("Senior Full Stack Engineer");
    expect(report.company).toBe("CloudScale Systems");
  });

  it("strictly refuses to fabricate arbitrary numbers or percentage metrics", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    for (const bullet of report.bulletImprovements) {
      // Improved bullet must not inject made-up metric percentages like "by 40%"
      expect(bullet.improvedBullet).not.toMatch(/\bby\s+\d+%/i);
      expect(bullet.truthWarning).toBeDefined();
      expect(bullet.truthWarning).toContain("ONLY if you have actually measured");
    }
  });

  it("identifies missing keywords and explicitly requires evidence before adding to resume", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    // Kubernetes is missing from candidate's resume/matrix
    const k8sCoverage = report.keywordCoverage.find(
      (k) => k.keyword.toLowerCase() === "kubernetes"
    );
    expect(k8sCoverage).toBeDefined();
    expect(k8sCoverage?.status).toBe("missing");
    expect(k8sCoverage?.highlightTag).toBe("MISSING");
    expect(k8sCoverage?.evidenceRequiredNote).toContain("Evidence required before adding to resume");
    expect(k8sCoverage?.evidenceSnippet).toBeUndefined();
  });

  it("identifies skills already present but poorly represented with WEAK_EVIDENCE tag", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    // Docker was only claimed in technical skills with low confidence
    const dockerItem = report.poorlyRepresentedSkills.find(
      (p) => p.skill.toLowerCase() === "docker"
    );
    expect(dockerItem).toBeDefined();
    expect(dockerItem?.highlightTag).toBe("WEAK_EVIDENCE");
    expect(dockerItem?.recommendation).toMatch(/workflow|bullet point|architectural/i);
    expect(dockerItem?.evidenceRequiredNote).toMatch(/fictitious|technical depth/i);
  });

  it("generates evidence-grounded project improvements without fictitious features", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    expect(report.projectImprovements.length).toBeGreaterThan(0);
    const devPlatform = report.projectImprovements.find((p) => p.projectName === "DevPlatform");
    expect(devPlatform).toBeDefined();
    expect(devPlatform?.highlightTag).toBe("RECOMMENDED");
    expect(devPlatform?.truthCheckNote).toContain("do not claim unbuilt features");
  });

  it("generates structured recommendations for all 5 resume sections", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    const sections = report.sectionRecommendations.map((s) => s.sectionName);
    expect(sections).toContain("Professional Summary");
    expect(sections).toContain("Skills Section");
    expect(sections).toContain("Work Experience");
    expect(sections).toContain("Projects");
    expect(sections).toContain("Education & Certifications");
  });

  it("produces a concrete two-tier skills section separating verified from developing skills", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    expect(report.skillsSectionRecommendation).toBeDefined();
    const categories = report.skillsSectionRecommendation?.categories || [];
    expect(categories.length).toBeGreaterThan(0);

    // TypeScript and React should be verified; Docker should be developing
    const allVerified = categories.flatMap((c) => c.verifiedSkills);
    const allDeveloping = categories.flatMap((c) => c.developingSkills);

    expect(allVerified).toContain("TypeScript");
    expect(allVerified).toContain("React");
    expect(allDeveloping).toContain("Docker");
  });

  it("preserves original resume summary and leaves original text untouched", () => {
    const report = engine.optimize({
      resume: mockResume,
      matrix: mockMatrix,
      job: mockJob,
      gapReport: mockGapReport,
    });

    expect(report.originalResumeSummary).toBeDefined();
    expect(report.originalResumeSummary?.candidateName).toBe("Alex Dev");
    expect(report.originalResumeSummary?.bulletCount).toBe(3); // 2 in exp + 1 in proj
    expect(report.originalResumeSummary?.sectionsPresent).toContain("Work Experience");
    expect(report.originalResumeSummary?.sectionsPresent).toContain("Projects");
  });

  it("successfully exposes POST /api/v1/optimizer/optimize and GET /api/v1/optimizer/latest", async () => {
    const postRes = await request(app)
      .post("/api/v1/optimizer/optimize")
      .send({
        resumeId: mockResume.id,
        jobId: mockJob.id,
      });

    expect(postRes.status).toBe(200);
    expect(postRes.body.status).toBe("success");
    expect(postRes.body.data.id).toBeDefined();
    const generatedId = postRes.body.data.id;

    // Fetch latest
    const latestRes = await request(app).get("/api/v1/optimizer/latest");
    expect(latestRes.status).toBe(200);
    expect(latestRes.body.data.id).toBe(generatedId);

    // Fetch by ID
    const byIdRes = await request(app).get(`/api/v1/optimizer/${generatedId}`);
    expect(byIdRes.status).toBe(200);
    expect(byIdRes.body.data.targetRole).toBe("Senior Full Stack Engineer");
  });

  it("handles missing resumes gracefully with 404 response", async () => {
    const res = await request(app)
      .post("/api/v1/optimizer/optimize")
      .send({
        resumeId: "non-existent-resume-id",
        jobId: mockJob.id,
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
