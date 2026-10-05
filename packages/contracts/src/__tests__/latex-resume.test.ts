import { describe, expect, it } from "vitest";
import {
  escapeLatex,
  generateLatexFromResume,
  latexCompileRequestSchema,
  latexCompileResponseSchema,
} from "../latex-resume.js";
import type { ResumeExtraction } from "../resume.js";

const mockResume: ResumeExtraction = {
  id: "test-resume-01",
  fileName: "test_resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 125000,
  rawText: "Alex Rivera Software Engineer",
  profile: {
    name: "Alex Rivera",
    email: "alex@example.com",
    location: "San Francisco, CA",
    githubUrl: "https://github.com/alexrivera-dev",
    linkedinUrl: "https://linkedin.com/in/alexrivera-dev",
    summary: "Full stack engineer specializing in TypeScript & React.",
    yearsOfExperienceEstimate: 3,
  },
  skillsClaimed: [
    "TypeScript",
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Docker",
    "MongoDB",
    "REST APIs",
  ],
  experience: [
    {
      company: "Acme Tech Inc & Partners",
      role: "Software Engineer",
      startDate: "2022",
      endDate: "Present",
      current: true,
      location: "San Francisco, CA",
      bullets: [
        "Built responsive web app using React & Redux with 99.9% uptime.",
        "Engineered RESTful API endpoints in Node.js processing $50M in annual transactions.",
      ],
      technologies: ["React", "Node.js", "TypeScript"],
    },
  ],
  projects: [
    {
      name: "CloudCart",
      role: "Full Stack Engineer",
      description: "Headless E-Commerce catalog and cart engine",
      technologies: ["React", "Node.js", "Docker"],
      githubUrl: "https://github.com/alexrivera-dev/cloudcart",
      bullets: [
        "Architected containerized microservices using Docker & Node.js.",
      ],
    },
  ],
  education: [
    {
      institution: "University of California, Davis",
      degree: "B.S. in Computer Science",
      startDate: "2018",
      endDate: "2022",
      fieldOfStudy: "Computer Science",
    },
  ],
  certifications: [],
  achievements: [],
  parsedAt: "2026-10-01T12:00:00.000Z",
};

describe("LaTeX Resume Generator & Contracts", () => {
  it("escapes LaTeX reserved characters properly", () => {
    expect(escapeLatex("React & Node.js")).toBe("React \\& Node.js");
    expect(escapeLatex("100% test coverage")).toBe("100\\% test coverage");
    expect(escapeLatex("Costs $50/mo")).toBe("Costs \\$50/mo");
    expect(escapeLatex("User #42")).toBe("User \\#42");
    expect(escapeLatex("snake_case_variable")).toBe("snake\\_case\\_variable");
    expect(escapeLatex("{brackets}")).toBe("\\{brackets\\}");
  });

  it("generates 100% ATS-friendly Jake's Resume LaTeX document from ResumeExtraction", () => {
    const tex = generateLatexFromResume(mockResume);

    // Structure checks
    expect(tex).toContain("\\documentclass[letterpaper,11pt]{article}");
    expect(tex).toContain("\\pdfgentounicode=1"); // ATS machine readability
    expect(tex).toContain("\\section{Education}");
    expect(tex).toContain("\\section{Experience}");
    expect(tex).toContain("\\section{Projects}");
    expect(tex).toContain("\\section{Technical Skills}");

    // Content checks
    expect(tex).toContain("Alex Rivera");
    expect(tex).toContain("alex@example.com");
    expect(tex).toContain("Acme Tech Inc \\& Partners");
    expect(tex).toContain("CloudCart");
    expect(tex).toContain("TypeScript");
    expect(tex).toContain("Docker");
    expect(tex).toContain("University of California, Davis");
  });

  it("validates compile request and response schemas", () => {
    const validReq = latexCompileRequestSchema.parse({
      texSource: "\\documentclass{article}\\begin{document}Hello\\end{document}",
      engine: "pdflatex",
    });
    expect(validReq.engine).toBe("pdflatex");

    const validRes = latexCompileResponseSchema.parse({
      status: "success",
      pdfBase64: "JVBERi0xLjQK...",
      engineUsed: "latexonline",
      compileDurationMs: 450,
    });
    expect(validRes.status).toBe("success");
    expect(validRes.engineUsed).toBe("latexonline");
  });
});
