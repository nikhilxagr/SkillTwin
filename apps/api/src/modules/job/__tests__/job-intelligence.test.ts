import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";

const sampleJobDescription = `
Senior Full Stack Engineer
Linear Systems Inc. | San Francisco, CA (Hybrid / Remote Option)

ABOUT THE ROLE
Linear Systems is engineering next-generation real-time developer productivity tooling.
We are looking for a Senior Full Stack Engineer with 5+ years of experience to lead the development of our high-throughput collaborative workspace.

RESPONSIBILITIES
- Architect, build, and maintain mission-critical web applications using React, TypeScript, and Node.js.
- Design resilient RESTful APIs and event-driven backend services connected to PostgreSQL and Redis.
- Collaborate with product designers and engineering leadership to ship performant user experiences.
- Champion code quality, comprehensive automated testing, and participate in peer code reviews.
- Mentor junior and mid-level engineers on distributed systems and frontend architecture best practices.

BASIC QUALIFICATIONS & REQUIRED SKILLS
- 5+ years of professional software engineering experience.
- Deep, hands-on production expertise in TypeScript, JavaScript, and Node.js.
- Strong proficiency in modern React (React 18, React.js, hooks, and state management).
- Strong experience designing relational schemas, writing complex queries, and optimizing PostgreSQL.
- Proven experience with Git, GitHub pull request workflows, and automated testing (Jest, Vitest).
- Excellent technical communication and cross-functional team collaboration skills.

PREFERRED QUALIFICATIONS & NICE TO HAVE
- Experience deploying and orchestrating containers with Docker and Kubernetes (K8s).
- Hands-on knowledge of AWS cloud infrastructure (ECS, Lambda, S3, RDS).
- Familiarity with Infrastructure as Code using Terraform.
- Experience with JWT authentication, OAuth2, and web application security standards.
- Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
`;

describe("Phase 4: Job Description Intelligence Pipeline", () => {
  let createdJobId = "";

  describe("POST /api/v1/jobs/text", () => {
    it("successfully extracts requirements and normalizes skills from structured JD text", async () => {
      const response = await request(app)
        .post("/api/v1/jobs/text")
        .send({
          title: "Senior Full Stack Engineer",
          company: "Linear Systems Inc.",
          text: sampleJobDescription,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      const { data } = response.body;

      expect(data).toHaveProperty("job");
      expect(data).toHaveProperty("analysis");

      const job = data.job;
      expect(job.id).toBeTruthy();
      createdJobId = job.id;

      // Role and Company
      expect(job.title).toContain("Senior Full Stack Engineer");
      expect(job.company).toBe("Linear Systems Inc.");

      // Experience & Education
      expect(job.experience.minYears).toBe(5);
      expect(job.experience.level).toBe("Senior");
      expect(job.education).toContain("Computer Science");

      // Verify Required vs. Preferred separation
      expect(job.requiredSkills.length).toBeGreaterThanOrEqual(4);
      expect(job.preferredSkills.length).toBeGreaterThanOrEqual(2);

      // Verify all required skills have importance = Required
      for (const req of job.requiredSkills) {
        expect(req.importance).toBe("Required");
        expect(req.canonicalName).toBeTruthy();
        expect(req.category).toBeTruthy();
        expect(req.contextSentence).toBeTruthy();
      }

      // Verify all preferred skills have importance = Preferred
      for (const pref of job.preferredSkills) {
        expect(pref.importance).toBe("Preferred");
        expect(pref.canonicalName).toBeTruthy();
        expect(pref.category).toBeTruthy();
        expect(pref.contextSentence).toBeTruthy();
      }

      // Verify Canonical Normalization of skill aliases
      const reactSkill = job.requiredSkills.find((s: any) => s.canonicalName === "React");
      expect(reactSkill).toBeDefined();
      expect(reactSkill.category).toBe("Frontend");

      const tsSkill = job.requiredSkills.find((s: any) => s.canonicalName === "TypeScript");
      expect(tsSkill).toBeDefined();
      expect(tsSkill.category).toBe("Languages");

      const pgSkill = job.requiredSkills.find((s: any) => s.canonicalName === "PostgreSQL");
      expect(pgSkill).toBeDefined();
      expect(pgSkill.category).toBe("Databases");

      // Verify Docker and Kubernetes are under Preferred
      const dockerSkill = job.preferredSkills.find((s: any) => s.canonicalName === "Docker");
      expect(dockerSkill).toBeDefined();
      expect(dockerSkill.importance).toBe("Preferred");

      const k8sSkill = job.preferredSkills.find((s: any) => s.canonicalName === "Kubernetes");
      expect(k8sSkill).toBeDefined();
      expect(k8sSkill.importance).toBe("Preferred");

      // Responsibilities
      expect(job.responsibilities.length).toBeGreaterThanOrEqual(3);

      // Keywords
      expect(job.keywords.programmingLanguages).toContain("TypeScript");
      expect(job.keywords.frameworks).toContain("React");

      // Analysis summary
      const analysis = data.analysis;
      expect(analysis.id).toBe(`analysis-${job.id}`);
      expect(analysis.summary.roleTitle).toBe(job.title);
      expect(analysis.summary.totalRequiredSkills).toBe(job.requiredSkills.length);
      expect(analysis.summary.totalPreferredSkills).toBe(job.preferredSkills.length);
      expect(analysis.summary.experienceLevel).toBe("Senior");
      expect(analysis.summary.topCategories.length).toBeGreaterThan(0);
    });

    it("rejects empty text payload with 400 Bad Request", async () => {
      const response = await request(app)
        .post("/api/v1/jobs/text")
        .send({ text: "   " });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("field 'text' is required");
    });
  });

  describe("GET /api/v1/jobs/:id", () => {
    it("retrieves the parsed job description by id", async () => {
      expect(createdJobId).toBeTruthy();
      const response = await request(app).get(`/api/v1/jobs/${createdJobId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.id).toBe(createdJobId);
      expect(response.body.data.title).toContain("Senior Full Stack Engineer");
    });

    it("returns 404 for unknown job id", async () => {
      const response = await request(app).get("/api/v1/jobs/non-existent-uuid-12345");
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/jobs/:id/analysis", () => {
    it("retrieves the computed job analysis by id", async () => {
      expect(createdJobId).toBeTruthy();
      const response = await request(app).get(`/api/v1/jobs/${createdJobId}/analysis`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.job.id).toBe(createdJobId);
      expect(response.body.data.summary.totalRequiredSkills).toBeGreaterThan(0);
    });

    it("returns 404 for unknown job analysis", async () => {
      const response = await request(app).get("/api/v1/jobs/non-existent-uuid-12345/analysis");
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/jobs/latest", () => {
    it("retrieves the most recently processed job and analysis", async () => {
      const response = await request(app).get("/api/v1/jobs/latest");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.job.id).toBe(createdJobId);
    });
  });

  describe("POST /api/v1/jobs/upload", () => {
    it("rejects requests missing file", async () => {
      const response = await request(app).post("/api/v1/jobs/upload");
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No file was uploaded");
    });

    it("successfully processes an uploaded TXT job description file", async () => {
      const response = await request(app)
        .post("/api/v1/jobs/upload")
        .attach("job", Buffer.from(sampleJobDescription), {
          filename: "Linear_Systems_Job.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.job.title).toContain("Senior Full Stack Engineer");
      expect(response.body.data.job.requiredSkills.length).toBeGreaterThanOrEqual(4);
    });
  });
});
