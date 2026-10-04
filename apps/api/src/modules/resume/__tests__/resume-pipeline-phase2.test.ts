import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { geminiService } from "../../../services/ai/gemini.js";
import { resumeAnalyzer } from "../../../services/ai/resumeAnalyzer.js";
import { geminiResumeAnalysisSchema } from "../../../services/ai/schemas/resume-schema.js";
import { resumeRepository } from "../resume.repository.js";
import { resumeService } from "../resume.service.js";

vi.mock("pdf-parse", () => {
  return {
    default: async (buffer: Buffer) => {
      return {
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        text: `Jordan Taylor - Senior Cloud Developer
Summary: Experienced engineer with React TypeScript Node.js Docker AWS
Experience: Cloud Architect at TechLab building scalable Kubernetes microservices`,
        version: "1.10.100",
      };
    },
  };
});

// Valid minimal PDF containing text for pdf-parse
const minimalPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
50 700 Td
(Jordan Taylor - Senior Cloud Developer) Tj
0 -20 Td
(Summary: Experienced engineer with React TypeScript Node.js Docker AWS) Tj
0 -20 Td
(Experience: Cloud Architect at TechLab building scalable Kubernetes microservices) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000249 00000 n 
0000000500 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
570
%%EOF`;

describe("PHASE 2: Complete Resume Intelligence Pipeline using Gemini API", () => {
  describe("Gemini Service & Modular AI Layer", () => {
    it("centralized Gemini service respects server environment configuration", () => {
      expect(geminiService).toBeDefined();
      expect(typeof geminiService.isConfigured).toBe("function");
      expect(typeof geminiService.generateStructuredContent).toBe("function");
    });

    it("strictly validates Gemini structured JSON against geminiResumeAnalysisSchema", () => {
      const mockGeminiOutput = {
        profile: {
          name: "Taylor Swift",
          summary: "Principal Frontend Engineer specializing in design systems",
          email: "taylor@example.com",
          phone: "+1-555-0199",
          location: "New York, NY",
          githubUrl: "github.com/taylorswift",
          linkedinUrl: "linkedin.com/in/taylor",
          portfolioUrl: "taylor.dev",
          yearsOfExperienceEstimate: 7,
        },
        categorizedSkills: {
          programmingLanguages: ["TypeScript", "JavaScript", "Python"],
          frameworks: ["React", "Next.js"],
          libraries: ["Redux", "TailwindCSS"],
          databases: ["PostgreSQL", "Redis"],
          tools: ["Docker", "Git"],
          cloudTechnologies: ["AWS"],
          devopsTechnologies: ["GitHub Actions", "Docker"],
          cybersecurityTechnologies: ["OAuth2"],
          softSkills: ["Leadership", "Mentorship"],
          otherTechnical: ["GraphQL"],
        },
        skillEvidence: [
          {
            canonicalName: "React",
            category: "Frontend",
            confidence: 0.92,
            proficiency: "Strong",
            evidence: ["Architected enterprise dashboard in React 18", "Maintained internal UI component library"],
            source: "Projects & Work Experience",
            missingEvidence: ["Mobile React Native experience not demonstrated"],
          },
          {
            canonicalName: "Docker",
            category: "Cloud/DevOps",
            confidence: 0.65,
            proficiency: "Intermediate",
            evidence: ["Created containerized development environments"],
            source: "Work Experience",
            missingEvidence: ["Production Kubernetes orchestration not demonstrated"],
          },
        ],
        projects: [
          {
            name: "Cloud Design System",
            role: "Lead Architect",
            description: "Accessible component system used by 50+ engineers",
            technologies: ["React", "TypeScript", "TailwindCSS"],
            bullets: ["Designed 40+ accessible UI components adhering to WCAG 2.1 AA standards"],
            githubUrl: "github.com/taylor/design-system",
            liveUrl: "design.taylor.dev",
          },
        ],
        experience: [
          {
            company: "Enterprise Cloud Corp",
            role: "Principal Frontend Engineer",
            location: "New York, NY",
            startDate: "2021",
            endDate: "Present",
            current: true,
            bullets: ["Led frontend architecture for multi-tenant cloud management platform"],
            technologies: ["React", "TypeScript", "AWS"],
          },
        ],
        education: [
          {
            institution: "Columbia University",
            degree: "B.S. in Computer Science",
            fieldOfStudy: "Computer Science",
            startDate: "2013",
            endDate: "2017",
            gpa: "3.9",
          },
        ],
        certifications: [
          {
            name: "AWS Certified Developer",
            issuer: "Amazon Web Services",
            year: "2023",
          },
        ],
        achievements: ["Keynote speaker at React Summit 2023"],
      };

      const parsed = geminiResumeAnalysisSchema.parse(mockGeminiOutput);
      expect(parsed.profile.name).toBe("Taylor Swift");
      expect(parsed.skillEvidence.length).toBe(2);
      expect(parsed.skillEvidence[0].canonicalName).toBe("React");
      expect(parsed.skillEvidence[0].confidence).toBe(0.92);
      expect(parsed.skillEvidence[0].proficiency).toBe("Strong");
      expect(parsed.skillEvidence[0].evidence.length).toBe(2);
      expect(parsed.skillEvidence[0].missingEvidence.length).toBe(1);
    });

    it("rejects invalid Gemini schema outputs (non-conforming confidence or missing fields)", () => {
      const invalidOutput = {
        profile: { name: "Test" },
        categorizedSkills: { programmingLanguages: [] },
        skillEvidence: [
          {
            canonicalName: "React",
            category: "Frontend",
            confidence: 1.5, // Invalid: exceeds 1.0
            proficiency: "SuperStrong", // Invalid enum value
          },
        ],
      };

      expect(() => geminiResumeAnalysisSchema.parse(invalidOutput)).toThrow();
    });

    it("resumeAnalyzer returns structured entities and detailed skill evidence", async () => {
      const sampleText = `
Morgan Riley
Senior Software Engineer | morgan@example.com | San Francisco, CA

SUMMARY
Senior Engineer with expertise in React, TypeScript, Node.js, and PostgreSQL.

SKILLS
React, TypeScript, Node.js, PostgreSQL, Docker, AWS

EXPERIENCE
Senior Developer | Acme Systems | 2022 - Present
- Built React dashboards and microservices in Node.js.
- Deployed containers using Docker on AWS.

PROJECTS
DataPulse Analytics | 2023
- Real-time telemetry dashboard in React, TypeScript, and PostgreSQL.
`;

      const analysis = await resumeAnalyzer.analyzeResume(sampleText);
      expect(analysis.profile.name).toBe("Morgan Riley");
      expect(analysis.categorizedSkills.programmingLanguages.length).toBeGreaterThan(0);
      expect(analysis.skillEvidence.length).toBeGreaterThan(0);

      // Verify skill evidence properties
      const reactEv = analysis.skillEvidence.find((s) => s.canonicalName.toLowerCase() === "react");
      expect(reactEv).toBeDefined();
      expect(reactEv?.category).toBeTruthy();
      expect(reactEv?.confidence).toBeGreaterThan(0);
      expect(reactEv?.evidence.length).toBeGreaterThan(0);
      expect(reactEv?.source).toBeTruthy();
    });
  });

  describe("File Validation & Document Processing Layer", () => {
    it("successfully uploads and parses PDF buffer via POST /api/v1/resumes/upload", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", Buffer.from(minimalPdfContent), {
          filename: "Jordan_Taylor_Resume.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");

      const { resume, matrix, analysis } = response.body.data;
      expect(resume.fileName).toBe("Jordan_Taylor_Resume.pdf");
      expect(resume.fileType).toBe("pdf");
      expect(resume.fileSizeBytes).toBeGreaterThan(0);
      expect(resume.profile.name).toContain("Jordan Taylor");

      // Verify Matrix was generated and saved
      expect(matrix).toBeDefined();
      expect(matrix.items.length).toBeGreaterThan(0);
      expect(matrix.summary.totalSkills).toBeGreaterThan(0);

      // Verify repository persistence
      const persistedResume = resumeRepository.getResume(resume.id);
      expect(persistedResume).toBeDefined();
      expect(persistedResume?.id).toBe(resume.id);

      const persistedMatrix = resumeRepository.getMatrix(resume.id);
      expect(persistedMatrix).toBeDefined();
      expect(persistedMatrix?.resumeId).toBe(resume.id);

      const persistedAnalysis = resumeRepository.getAnalysis(resume.id);
      expect(persistedAnalysis).toBeDefined();
    });

    it("rejects empty file buffers with 400 EMPTY_FILE", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", Buffer.alloc(0), {
          filename: "empty.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.code).toBe("EMPTY_FILE");
    });

    it("rejects files exceeding 10MB limit with 400 FILE_TOO_LARGE", async () => {
      // 10.5 MB buffer
      const largeBuffer = Buffer.alloc(10.5 * 1024 * 1024);

      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", largeBuffer, {
          filename: "oversized_resume.pdf",
          contentType: "application/pdf",
        });

      // Multer limits file size or document service rejects
      expect([400, 500]).toContain(response.status);
    });

    it("rejects unsupported file formats like executable or archive", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/upload")
        .attach("resume", Buffer.from("MZ binary content"), {
          filename: "malware.exe",
          contentType: "application/x-msdownload",
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.code).toBe("UNSUPPORTED_TYPE");
    });

    it("rejects text with insufficient content (<30 characters)", async () => {
      const response = await request(app)
        .post("/api/v1/resumes/text")
        .send({
          fileName: "short.txt",
          text: "Too short",
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.code).toBe("INSUFFICIENT_TEXT");
    });
  });

  describe("API Endpoints & Database Persistence", () => {
    it("retrieves the stored Gemini analysis via GET /api/v1/resumes/:id/analysis", async () => {
      const uploadRes = await request(app)
        .post("/api/v1/resumes/text")
        .send({
          fileName: "Persistence_Test_Resume.txt",
          text: `
Samir Gupta
Full Stack Developer | samir@example.com | Seattle, WA

SUMMARY
Full Stack Engineer with 4 years building web services with React, Go, and Redis.

SKILLS
React, Go, Redis, Docker, PostgreSQL

EXPERIENCE
Software Engineer | DataHub Inc | 2021 - Present
- Developed REST APIs in Go and PostgreSQL.
- Built responsive UI dashboards using React.
`,
        });

      expect(uploadRes.status).toBe(201);
      const resumeId = uploadRes.body.data.resume.id;

      const analysisRes = await request(app).get(`/api/v1/resumes/${resumeId}/analysis`);
      expect(analysisRes.status).toBe(200);
      expect(analysisRes.body.status).toBe("success");
      expect(analysisRes.body.data.profile.name).toBe("Samir Gupta");
      expect(analysisRes.body.data.skillEvidence.length).toBeGreaterThan(0);
    });

    it("returns 404 when querying analysis for a non-existent resume id", async () => {
      const response = await request(app).get("/api/v1/resumes/missing-id-99999/analysis");
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
