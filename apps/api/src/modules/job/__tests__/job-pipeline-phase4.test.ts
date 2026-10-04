import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { JobAnalyzer } from "../../../services/ai/jobAnalyzer.js";
import { GeminiService } from "../../../services/ai/gemini.js";
import { skillNormalizer } from "../../skills/skill-normalizer.js";

const sampleSeniorJobDescription = `
Position: Lead Cloud Infrastructure Engineer
Company: Apex Cloud Technologies
Location: New York, NY (Hybrid)

ABOUT THE ROLE:
Apex Cloud Technologies delivers zero-trust cloud orchestrations for global fintech enterprises.
We are looking for a Lead Cloud Infrastructure Engineer with 6+ years of experience to design our next-generation multi-cloud platform.

RESPONSIBILITIES:
- Architect and operate resilient multi-region infrastructure across AWS and Google Cloud Platform (GCP).
- Standardize infrastructure as code using Terraform and automated CI/CD deployment pipelines.
- Implement container orchestration at scale with Kubernetes and Docker.
- Partner with security teams to enforce OAuth2, JWT authentication, and OWASP compliance.
- Lead technical design reviews and mentor junior DevOps engineers on site reliability practices.

REQUIRED MUST-HAVE COMPETENCIES:
- 6+ years of production experience managing cloud environments.
- Deep hands-on expertise with AWS (ECS, Lambda, S3, IAM, VPC).
- Advanced mastery of Docker and Kubernetes container orchestration.
- Proven track record with Terraform Infrastructure as Code.
- Strong proficiency in Python or Go for infrastructure automation.
- Extensive experience implementing automated testing and CI/CD pipelines.

PREFERRED NICE-TO-HAVE SKILLS:
- Familiarity with Google Cloud Platform (GCP) or Azure.
- Hands-on experience with Redis caching and PostgreSQL database administration.
- Bachelor's degree in Computer Science or equivalent practical engineering experience.
- Background in web application cybersecurity and zero-trust networking.
`;

describe("PHASE 4: Job Description Intelligence Pipeline with Gemini", () => {
  describe("1. JobAnalyzer Unit & Model Fallback Testing", () => {
    it("falls back to deterministic parser gracefully when Gemini is not configured", async () => {
      const mockGemini = new GeminiService();
      vi.spyOn(mockGemini, "isConfigured").mockReturnValue(false);

      const analyzer = new JobAnalyzer(mockGemini);
      const result = await analyzer.analyzeJob(sampleSeniorJobDescription, "Lead Cloud Infrastructure Engineer", "Apex Cloud Technologies");

      expect(result).toBeDefined();
      expect(result.title).toContain("Lead Cloud Infrastructure Engineer");
      expect(result.company).toBe("Apex Cloud Technologies");
      expect(result.experience.minYears).toBe(6);
      expect(result.experience.level).toBe("Lead");

      // Verify required skills are populated
      expect(result.requiredSkills.length).toBeGreaterThanOrEqual(3);
      for (const skill of result.requiredSkills) {
        expect(skill.importance).toBe("Required");
      }

      // Verify preferred skills are populated
      expect(result.preferredSkills.length).toBeGreaterThanOrEqual(1);
      for (const skill of result.preferredSkills) {
        expect(skill.importance).toBe("Preferred");
      }
    });

    it("parses mock Gemini structured response correctly when Gemini API is active", async () => {
      const mockGemini = new GeminiService();
      vi.spyOn(mockGemini, "isConfigured").mockReturnValue(true);
      vi.spyOn(mockGemini, "generateStructuredContent").mockResolvedValue({
        role: "Staff Backend Engineer",
        company: "Stripe",
        location: "Seattle, WA",
        experience: {
          minYears: 7,
          maxYears: 10,
          level: "Senior",
          description: "7+ years building distributed payment systems",
        },
        education: {
          degree: "B.S.",
          field: "Computer Science",
          required: false,
          description: "B.S. in Computer Science or equivalent practical experience",
        },
        requiredSkills: [
          {
            name: "Go",
            category: "Languages",
            importance: "Required",
            minimumProficiency: "Strong",
            contextSentence: "Must have 5+ years of Go concurrency.",
            whyRequired: "Primary language for high-throughput payment APIs.",
          },
          {
            name: "PostgreSQL",
            category: "Databases",
            importance: "Required",
            minimumProficiency: "Strong",
            contextSentence: "Must understand transactional isolation and locking in PostgreSQL.",
            whyRequired: "Mission-critical ACID ledger persistence.",
          },
        ],
        preferredSkills: [
          {
            name: "Kafka",
            category: "Backend",
            importance: "Preferred",
            minimumProficiency: "Intermediate",
            contextSentence: "Experience with distributed event streaming via Kafka is a plus.",
            whyPreferred: "Async settlement queueing.",
          },
        ],
        categorizedSkills: {
          programmingLanguages: ["Go", "Java"],
          frameworks: ["gRPC"],
          libraries: [],
          databases: ["PostgreSQL", "Redis"],
          tools: ["Git", "Linux"],
          cloud: ["AWS"],
          devops: ["Docker", "Kubernetes"],
          testing: ["Automated Testing"],
          security: ["OAuth", "JWT"],
          softSkills: ["Technical Mentorship", "Code Reviews"],
        },
        responsibilities: [
          "Design fault-tolerant payment rails.",
          "Maintain 99.999% ledger availability.",
        ],
        qualifications: [
          "7+ years backend distributed systems experience.",
        ],
        keywords: ["Go", "PostgreSQL", "Distributed Systems", "ACID", "Kafka"],
      });

      const analyzer = new JobAnalyzer(mockGemini);
      const result = await analyzer.analyzeJob("Mock JD text", "Staff Backend Engineer", "Stripe");

      expect(result.title).toBe("Staff Backend Engineer");
      expect(result.company).toBe("Stripe");
      expect(result.experience.minYears).toBe(7);
      expect(result.experience.level).toBe("Senior");
      expect(result.requiredSkills).toHaveLength(2);
      expect(result.preferredSkills).toHaveLength(1);
      expect(result.categorizedSkills.cloudDevOps).toContain("AWS");
      expect(result.categorizedSkills.cloudDevOps).toContain("Docker");
      expect(result.categorizedSkills.cybersecurity).toContain("OAuth");
    });
  });

  describe("2. End-to-End Skill Engine Normalization on JD Ingestion", () => {
    let createdJobId = "";

    it("extracts, normalizes, and stores a Job Description with strict Required vs Preferred separation", async () => {
      const response = await request(app)
        .post("/api/v1/jobs/text")
        .send({
          title: "Lead Cloud Infrastructure Engineer",
          company: "Apex Cloud Technologies",
          text: sampleSeniorJobDescription,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      const { data } = response.body;

      const job = data.job;
      createdJobId = job.id;
      expect(job.id).toBeTruthy();

      // Check extracted fields
      expect(job.title).toContain("Lead Cloud Infrastructure Engineer");
      expect(job.company).toBe("Apex Cloud Technologies");
      expect(job.experience.minYears).toBe(6);
      expect(job.experience.level).toBe("Lead");
      expect(job.education).toContain("Computer Science");

      // Verify Required skills
      expect(job.requiredSkills.length).toBeGreaterThanOrEqual(4);
      for (const skill of job.requiredSkills) {
        expect(skill.importance).toBe("Required");
        expect(skill.canonicalName).toBeTruthy();
        expect(skill.category).toBeTruthy();
        expect(skill.contextSentence).toBeTruthy();
      }

      // Verify Preferred skills
      expect(job.preferredSkills.length).toBeGreaterThanOrEqual(1);
      for (const skill of job.preferredSkills) {
        expect(skill.importance).toBe("Preferred");
        expect(skill.canonicalName).toBeTruthy();
        expect(skill.category).toBeTruthy();
        expect(skill.contextSentence).toBeTruthy();
      }

      // Verify Skill Engine Normalization of canonical names
      const awsSkill = job.requiredSkills.find((s: any) => s.canonicalName === "AWS");
      expect(awsSkill).toBeDefined();

      const dockerSkill = job.requiredSkills.find((s: any) => s.canonicalName === "Docker");
      expect(dockerSkill).toBeDefined();

      const k8sSkill = job.requiredSkills.find((s: any) => s.canonicalName === "Kubernetes");
      expect(k8sSkill).toBeDefined();

      const tfSkill = job.requiredSkills.find((s: any) => s.canonicalName === "Terraform");
      expect(tfSkill).toBeDefined();

      // Verify Keywords across categories
      expect(job.keywords.cloudDevOps).toContain("Docker");
      expect(job.keywords.cloudDevOps).toContain("Kubernetes");
      expect(job.keywords.cloudDevOps).toContain("Terraform");
      expect(job.keywords.cloudDevOps).toContain("AWS");

      // Verify Responsibilities
      expect(job.responsibilities.length).toBeGreaterThanOrEqual(3);

      // Verify Job Analysis Summary
      const analysis = data.analysis;
      expect(analysis.id).toBe(`analysis-${job.id}`);
      expect(analysis.summary.roleTitle).toBe(job.title);
      expect(analysis.summary.totalRequiredSkills).toBe(job.requiredSkills.length);
      expect(analysis.summary.totalPreferredSkills).toBe(job.preferredSkills.length);
      expect(analysis.summary.experienceLevel).toBe("Lead");
    });

    it("verifies normalization with skillNormalizer equivalence", () => {
      // Ensure that aliases like K8s match Kubernetes and TF matches Terraform
      expect(skillNormalizer.areSkillsEquivalent("K8s", "Kubernetes")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("TF", "Terraform")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("Docker", "Containerization")).toBe(true);
    });

    it("retrieves the parsed job and computed analysis via GET endpoints", async () => {
      expect(createdJobId).toBeTruthy();

      const jobRes = await request(app).get(`/api/v1/jobs/${createdJobId}`);
      expect(jobRes.status).toBe(200);
      expect(jobRes.body.data.id).toBe(createdJobId);

      const analysisRes = await request(app).get(`/api/v1/jobs/${createdJobId}/analysis`);
      expect(analysisRes.status).toBe(200);
      expect(analysisRes.body.data.job.id).toBe(createdJobId);
      expect(analysisRes.body.data.summary.totalRequiredSkills).toBeGreaterThan(0);

      const latestRes = await request(app).get("/api/v1/jobs/latest");
      expect(latestRes.status).toBe(200);
      expect(latestRes.body.data.job.id).toBe(createdJobId);
    });
  });
});
