import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import type { ResumeExtraction } from "@skilltwin/contracts";

const testResume: ResumeExtraction = {
  id: "resume-latex-test-01",
  fileName: "alex_resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 130000,
  rawText: "Alex Rivera Full Stack Engineer",
  profile: {
    name: "Alex Rivera",
    email: "alex@example.com",
    location: "San Francisco, CA",
    githubUrl: "https://github.com/alexrivera-dev",
    linkedinUrl: "https://linkedin.com/in/alexrivera-dev",
    summary: "Senior Full Stack Engineer",
    yearsOfExperienceEstimate: 4,
  },
  skillsClaimed: ["TypeScript", "React", "Node.js", "Docker"],
  experience: [
    {
      company: "Linear Dynamics",
      role: "Senior Software Engineer",
      startDate: "2022",
      endDate: "Present",
      current: true,
      location: "San Francisco, CA",
      bullets: [
        "Architected scalable microservices using Node.js & Docker.",
      ],
      technologies: ["Node.js", "Docker"],
    },
  ],
  projects: [
    {
      name: "DevPulse",
      role: "Lead Engineer",
      description: "Developer analytics sprint dashboard",
      technologies: ["React", "TypeScript", "Docker"],
      githubUrl: "https://github.com/alexrivera-dev/devpulse",
      bullets: ["Built real-time metrics platform."],
    },
  ],
  education: [
    {
      institution: "UC Davis",
      degree: "B.S. Computer Science",
      startDate: "2018",
      endDate: "2022",
      fieldOfStudy: "Computer Science",
    },
  ],
  certifications: [],
  achievements: [],
  parsedAt: "2026-10-01T10:00:00.000Z",
};

describe("LaTeX Resume Studio API", () => {
  it("GET /api/v1/latex/status returns compiler capabilities", async () => {
    const res = await request(app).get("/api/v1/latex/status");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.engines).toBeDefined();
    expect(res.body.engines.freeCloudAvailable).toBe(true);
  });

  it("POST /api/v1/latex/generate generates ATS-compliant Jake's Resume LaTeX", async () => {
    const res = await request(app)
      .post("/api/v1/latex/generate")
      .send({
        resume: testResume,
        templateId: "jakes-resume",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.texSource).toContain("\\documentclass[letterpaper,11pt]{article}");
    expect(res.body.data.texSource).toContain("Alex Rivera");
    expect(res.body.data.texSource).toContain("\\section{Technical Skills}");
    expect(res.body.data.atsFriendly).toBe(true);
    expect(res.body.data.pageBudget).toBeDefined();
    expect(res.body.data.pageBudget.status).toBe("optimal-one-page");
  });

  it("POST /api/v1/latex/generate generates minimal-ats and executive-standard", async () => {
    const resMin = await request(app)
      .post("/api/v1/latex/generate")
      .send({
        resume: testResume,
        templateId: "minimal-ats",
        font: "helvetica",
        margin: "compact",
      });

    expect(resMin.status).toBe(200);
    expect(resMin.body.data.templateId).toBe("minimal-ats");
    expect(resMin.body.data.texSource).toContain("Minimalist ATS");

    const resExec = await request(app)
      .post("/api/v1/latex/generate")
      .send({
        resume: testResume,
        templateId: "executive-standard",
        font: "times",
        margin: "spacious",
      });

    expect(resExec.status).toBe(200);
    expect(resExec.body.data.templateId).toBe("executive-standard");
    expect(resExec.body.data.texSource).toContain("Executive Standard");
  });

  it("POST /api/v1/latex/budget calculates 1-page fit prediction", async () => {
    const res = await request(app)
      .post("/api/v1/latex/budget")
      .send({
        resume: testResume,
        templateId: "jakes-resume",
        margin: "normal",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.estimatedPages).toBe(1);
    expect(res.body.data.status).toBe("optimal-one-page");
    expect(res.body.data.totalPoints).toBeGreaterThan(100);
  });

  it("POST /api/v1/latex/compile compiles LaTeX source code into PDF", async () => {
    const sampleTex = `\\documentclass{article}
\\begin{document}
\\section*{Alex Rivera}
Software Engineer resume compiled successfully.
\\end{document}`;

    const res = await request(app)
      .post("/api/v1/latex/compile")
      .send({
        texSource: sampleTex,
        engine: "pdflatex",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.pdfBase64).toBeDefined();
    expect(res.body.data.pdfBase64.length).toBeGreaterThan(100);
    expect(res.body.data.engineUsed).toBeDefined();
  }, 25000); // 25s timeout for compilation

  it("POST /api/v1/latex/compile?download=true returns application/pdf binary", async () => {
    const sampleTex = `\\documentclass{article}
\\begin{document}
Binary PDF Stream Test
\\end{document}`;

    const res = await request(app)
      .post("/api/v1/latex/compile?download=true")
      .send({
        texSource: sampleTex,
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.body).toBeDefined();
  }, 25000);

  it("POST /api/v1/latex/compile auto-repairs common TeX syntax issues like \\;|\\;, rogue linebreaks, and extra braces", async () => {
    const brokenTex = `\\documentclass{article}
\\usepackage[hidelinks]{hyperref}
\\begin{document}
\\section{Certifications}
\\\\[2pt]
\\small
Cisco Ethical Hacking Fundamentals \\;|\\; Cisco Ethical Hacking Advanced
\\href{https://example.com}{example.com}}
\\end{document}`;

    const res = await request(app)
      .post("/api/v1/latex/compile")
      .send({
        texSource: brokenTex,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.pdfBase64).toBeDefined();
  }, 25000);
});
