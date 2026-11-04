import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LatexStudioView } from "../components/latex/LatexStudioView.js";
import * as apiClient from "../api/client.js";
import type { ResumeExtraction } from "@skilltwin/contracts";

const testResume: ResumeExtraction = {
  id: "test-res-01",
  fileName: "resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 120000,
  rawText: "Sarah Connor Software Architect",
  profile: {
    name: "Sarah Connor",
    email: "sarah@example.com",
    location: "Los Angeles, CA",
    githubUrl: "https://github.com/sarahconnor",
    linkedinUrl: "https://linkedin.com/in/sarahconnor",
    summary: "Senior Software Architect with 8+ years experience.",
    yearsOfExperienceEstimate: 8,
  },
  skillsClaimed: ["TypeScript", "React", "Node.js", "Kubernetes"],
  experience: [
    {
      company: "Cyberdyne Systems",
      role: "Lead Systems Architect",
      startDate: "2021",
      endDate: "Present",
      current: true,
      location: "Los Angeles, CA",
      bullets: ["Architected distributed resilience microservices."],
      technologies: ["Node.js", "Kubernetes"],
    },
  ],
  projects: [
    {
      name: "DefenseGrid",
      role: "Lead Engineer",
      description: "Automated anomaly defense system",
      technologies: ["TypeScript", "Docker"],
      bullets: ["Deployed automated security screening."],
    },
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "B.S. Computer Science",
      startDate: "2013",
      endDate: "2017",
      fieldOfStudy: "Computer Science",
    },
  ],
  certifications: [],
  achievements: [],
  parsedAt: "2026-10-01T12:00:00.000Z",
};

describe("LatexStudioView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, "compileLatex").mockResolvedValue({
      pdfBase64: btoa("%PDF-1.4 Default Mock"),
      engineUsed: "latexonline.cc (free engine)",
      compileDurationMs: 300,
    });
  });

  it("renders LaTeX Studio with candidate information populated", () => {
    render(<LatexStudioView resume={testResume} />);
    expect(screen.getByTestId("latex-studio-view")).toBeDefined();
    expect(screen.getByTestId("compile-latex-btn")).toBeDefined();
    expect(screen.getByTestId("download-pdf-btn")).toBeDefined();

    const textarea = screen.getByTestId("latex-editor-textarea") as HTMLTextAreaElement;
    expect(textarea.value).toContain("Sarah Connor");
    expect(textarea.value).toContain("Cyberdyne Systems");
  });

  it("auto-compiles on load and allows PDF download", async () => {
    const fakeBase64 = btoa("%PDF-1.4 Fake PDF Content");
    vi.spyOn(apiClient, "compileLatex").mockResolvedValueOnce({
      pdfBase64: fakeBase64,
      engineUsed: "latexonline.cc (free engine)",
      compileDurationMs: 450,
    });

    render(<LatexStudioView resume={testResume} />);

    // Verify auto-compile was called
    await waitFor(() => {
      expect(apiClient.compileLatex).toHaveBeenCalled();
    });

    // Check preview iframe renders
    await waitFor(() => {
      expect(screen.getByTestId("pdf-preview-iframe")).toBeDefined();
    });

    // Check download button is enabled and functional
    const downloadPdfBtn = screen.getByTestId("download-pdf-btn") as HTMLButtonElement;
    expect(downloadPdfBtn.disabled).toBe(false);
  });

  it("handles compilation errors gracefully by showing diagnostic alert", async () => {
    vi.spyOn(apiClient, "compileLatex").mockRejectedValueOnce({
      message: "LaTeX compilation failed",
      log: "! LaTeX Error: Something's wrong--perhaps a missing \\item.",
    });

    render(<LatexStudioView resume={testResume} />);

    await waitFor(() => {
      expect(screen.getByText(/LaTeX Compilation Error/i)).toBeDefined();
    });
  });
});
