import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";

const sampleDeveloperResume = `
ALEX CHEN
Senior Full-Stack Engineer | alex.chen@example.com | github.com/alexchen | San Francisco, CA

SUMMARY
Full-Stack Engineer with 5+ years of experience designing high-throughput distributed systems and responsive web applications.
Proficient in TypeScript, React, Node.js, and PostgreSQL. Experienced with AWS cloud infrastructure and Docker containerization.

TECHNICAL SKILLS
- Programming Languages: TypeScript, JavaScript, Python, Go, SQL
- Frameworks & Libraries: React, Next.js, Express, TailwindCSS, Redux Toolkit
- Databases: PostgreSQL, Redis, MongoDB
- Tools & DevOps: Docker, Kubernetes, AWS (S3, ECS, Lambda), Git, GitHub Actions, Terraform
- Cybersecurity & Best Practices: OAuth2, JWT, OWASP Top 10, Role-Based Access Control (RBAC)
- Soft Skills: Technical Mentorship, Agile/Scrum, Cross-Functional Collaboration, System Design

WORK EXPERIENCE
Senior Full-Stack Engineer | TechCorp Inc. | 2022 - Present
- Architected and deployed microservices handling 25M+ daily requests using TypeScript, Node.js, and AWS ECS.
- Designed real-time dashboard in React and TailwindCSS, reducing customer load latency by 42%.
- Optimized complex PostgreSQL queries and implemented Redis caching, cutting P99 latency from 800ms to 95ms.
- Mentored 4 junior engineers on code reviews, system design, and TypeScript best practices.

Software Engineer | InnovateSoft | 2020 - 2022
- Built scalable REST APIs using Express and PostgreSQL for multi-tenant SaaS platform.
- Spearheaded CI/CD pipelines with GitHub Actions and Docker, reducing deployment cycle times by 65%.
- Implemented OAuth2 and JWT authentication mechanisms ensuring secure access control.

PROJECTS
SkillTwin Career Twin Platform | 2023 - 2024
- Created an AI-driven career intelligence engine using React, TypeScript, Next.js, and Python.
- Deployed on AWS with Docker and Terraform; integrated automated CI/CD testing.

Distributed Task Queue | 2022
- Implemented high-throughput worker queue in Go and Redis with automatic retries and dead-letter queues.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2016 - 2020
- Magna Cum Laude, GPA: 3.85/4.0

CERTIFICATIONS
- AWS Certified Solutions Architect - Associate | Amazon Web Services | 2023
- Certified Kubernetes Administrator (CKA) | Linux Foundation | 2022

ACHIEVEMENTS
- First place winner at TechCrunch Hackathon 2021 for real-time collaborative dev tooling.
- Published author of open-source TypeScript library with over 150k monthly npm downloads.
`;

describe("Phase 2: Resume Intelligence Pipeline", () => {
  let createdResumeId = "";

  describe("POST /api/v1/resumes/text", () => {
    it("successfully processes and analyzes structured resume text", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/text")
        .send({
          fileName: "Alex_Chen_Resume.txt",
          text: sampleDeveloperResume,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      const { data } = response.body;

      // Check structure
      expect(data).toHaveProperty("resume");
      expect(data).toHaveProperty("matrix");

      const resume = data.resume;
      expect(resume).toHaveProperty("id");
      expect(resume.fileName).toBe("Alex_Chen_Resume.txt");
      expect(resume.fileType).toBe("txt");
      expect(resume.rawText).toBeTruthy();
      expect(resume.parsedAt).toBeTruthy();

      createdResumeId = resume.id;

      // Check candidate profile
      expect(resume.profile.name).toBe("Alex Chen");
      expect(resume.profile.email).toBe("alex.chen@example.com");

      // Check extracted entities
      expect(resume.skillsClaimed.length).toBeGreaterThanOrEqual(5);
      expect(resume.experience.length).toBeGreaterThanOrEqual(2);
      expect(resume.projects.length).toBeGreaterThanOrEqual(2);
      expect(resume.education.length).toBeGreaterThanOrEqual(1);
      expect(resume.certifications.length).toBeGreaterThanOrEqual(1);
      expect(resume.achievements.length).toBeGreaterThanOrEqual(1);

      // Verify skill matrix generation
      const matrix = data.matrix;
      expect(matrix).toHaveProperty("items");
      expect(matrix).toHaveProperty("summary");
      expect(matrix.items.length).toBeGreaterThanOrEqual(5);

      // Every skill must have canonicalName, category, confidence, proficiency, evidence
      for (const skill of matrix.items) {
        expect(skill.canonicalName).toBeTruthy();
        expect(skill.category).toBeTruthy();
        expect(typeof skill.confidence).toBe("number");
        expect(skill.confidence).toBeGreaterThanOrEqual(0);
        expect(skill.confidence).toBeLessThanOrEqual(100);
        expect(["Strong", "Intermediate", "Beginner", "Weak"]).toContain(skill.proficiency);
        expect(["Demonstrated", "ClaimedOnly", "WeakEvidence"]).toContain(skill.evidenceLevel);
        expect(Array.isArray(skill.evidence)).toBe(true);

        // Verify evidence snippets are not empty and contain actual quotes
        for (const ev of skill.evidence) {
          expect(ev.context).toBeTruthy();
          expect(ev.sourceType).toBeTruthy();
        }
      }

      // Verify Demonstrated skills have evidence quotes from Experience or Projects
      const typeScriptSkill = matrix.items.find((s: any) => s.canonicalName.toLowerCase() === "typescript");
      expect(typeScriptSkill).toBeDefined();
      expect(typeScriptSkill.evidenceLevel).toBe("Demonstrated");
      expect(typeScriptSkill.confidence).toBeGreaterThanOrEqual(80);
      expect(typeScriptSkill.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects empty text payload with 400 Bad Request", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/text")
        .send({ text: "   " });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("field 'text' is required");
    });
  });

  describe("GET /api/v1/resumes/:id", () => {
    it("retrieves the parsed resume analysis by id", async () => {
      expect(createdResumeId).toBeTruthy();
      const response = await request(app).get(`/api/v1/resumes/${createdResumeId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.id).toBe(createdResumeId);
      expect(response.body.data.profile.name).toBe("Alex Chen");
    });

    it("returns 404 for unknown resume id", async () => {
      const response = await request(app).get("/api/v1/resumes/non-existent-uuid-12345");
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/resumes/:id/matrix", () => {
    it("retrieves the computed skill matrix by resume id", async () => {
      expect(createdResumeId).toBeTruthy();
      const response = await request(app).get(`/api/v1/resumes/${createdResumeId}/matrix`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.resumeId).toBe(createdResumeId);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.summary.totalSkills).toBeGreaterThan(0);
    });

    it("returns 404 for unknown resume matrix", async () => {
      const response = await request(app).get("/api/v1/resumes/non-existent-uuid-12345/matrix");
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/resumes/latest", () => {
    it("retrieves the most recently processed resume", async () => {
      const response = await request(app).get("/api/v1/resumes/latest");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.id).toBe(createdResumeId);
    });
  });

  describe("POST /api/v1/resumes/upload", () => {
    it("rejects requests missing file", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload");

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("No file was uploaded");
    });

    it("rejects unsupported file mime types", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", Buffer.from("image content"), {
          filename: "avatar.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.code).toBe("UNSUPPORTED_TYPE");
    });

    it("successfully uploads and processes a TXT resume file", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", Buffer.from(sampleDeveloperResume), {
          filename: "alex_resume.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.resume.fileName).toBe("alex_resume.txt");
      expect(response.body.data.resume.fileType).toBe("txt");
      expect(response.body.data.resume.profile.name).toBe("Alex Chen");
    });
  });
});
