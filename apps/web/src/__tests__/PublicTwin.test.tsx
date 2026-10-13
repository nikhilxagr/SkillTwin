import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicTwinView } from "../components/public/PublicTwinView.js";
import * as apiClient from "../api/client.js";

vi.mock("../api/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client.js")>();
  return {
    ...actual,
    getPublicTwinProfile: vi.fn(),
    matchRecruiterJobDescription: vi.fn(),
  };
});

describe("Feature 1: PublicTwinView Component & Recruiter JD Matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    username: "nikhil",
    name: "Nikhil Agrahari",
    avatarUrl: "https://example.com/avatar.png",
    headline: "Senior Full Stack & AI Systems Engineer",
    targetRole: "Senior Full Stack Engineer",
    bio: "Passionate engineer building distributed systems.",
    joinedAt: "2026-01-01T00:00:00.000Z",
    customPitch: "Looking for impactful Senior engineering roles.",
    socials: {
      github: "https://github.com/nikhilxagr",
      linkedin: "https://linkedin.com/in/nikhilagrahari",
      contactEmail: "nikhil@skilltwin.dev",
    },
    verifiedBadges: {
      emailVerified: true,
      githubConnected: true,
      githubUsername: "nikhilxagr",
      totalRepositoriesAnalyzed: 8,
      totalLinesOfCode: 42000,
      verifiedSkillsCount: 6,
    },
    skills: [
      {
        name: "TypeScript",
        category: "frontend",
        level: "advanced",
        verifiedByGithub: true,
        evidenceRepoName: "skilltwin-core",
        evidenceSnippet: "Verified in 4 repositories with strict type-safety",
      },
      {
        name: "React",
        category: "frontend",
        level: "advanced",
        verifiedByGithub: true,
        evidenceRepoName: "web-client",
        evidenceSnippet: "Production SPAs, hooks, state management",
      },
      {
        name: "Node.js",
        category: "backend",
        level: "advanced",
        verifiedByGithub: true,
        evidenceRepoName: "api-service",
        evidenceSnippet: "REST APIs and database connectors",
      },
    ],
    featuredProjects: [
      {
        name: "SkillTwin Platform",
        description: "Full-stack career intelligence platform.",
        languages: ["TypeScript", "React"],
        stars: 35,
        architectureHighlights: ["TypeScript monorepo", "Docker containerized"],
        verifiedMetrics: { commits: 120, loc: 18000 },
      },
    ],
    stats: {
      topLanguages: [{ language: "TypeScript", percentage: 70 }],
      readinessScore: 92,
    },
  };

  it("renders candidate identity, trust ribbon, and verified skills", async () => {
    vi.mocked(apiClient.getPublicTwinProfile).mockResolvedValueOnce(mockProfile as any);
    const onNavigate = vi.fn();

    render(<PublicTwinView username="nikhil" onNavigate={onNavigate} />);

    // Shows loading initially
    expect(screen.getByText(/Loading Verified Digital Twin/i)).toBeDefined();

    // Resolves and displays candidate profile
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Nikhil Agrahari" })).toBeDefined();
      expect(screen.getByText("Senior Full Stack & AI Systems Engineer")).toBeDefined();
      expect(screen.getByText("Email & Domain Verified")).toBeDefined();
      expect(screen.getByText("8 Repositories Verified")).toBeDefined();
      expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
      expect(screen.getAllByText("React").length).toBeGreaterThan(0);
      expect(screen.getByText("SkillTwin Platform")).toBeDefined();
    });
  });

  it("executes recruiter JD matching when job description is submitted", async () => {
    vi.mocked(apiClient.getPublicTwinProfile).mockResolvedValueOnce(mockProfile as any);
    vi.mocked(apiClient.matchRecruiterJobDescription).mockResolvedValueOnce({
      matchPercentage: 88,
      matchLevel: "High",
      summary: "Nikhil demonstrates a high match (88%) with verified code proof.",
      strengths: ["Demonstrated verifiable code proof in core stack: TypeScript, React"],
      matchingSkills: [
        {
          skill: "TypeScript",
          category: "frontend",
          verifiedEvidence: "Verified in 4 repositories with strict type-safety",
        },
      ],
      missingSkills: ["Kubernetes"],
    } as any);

    const onNavigate = vi.fn();
    render(<PublicTwinView username="nikhil" onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Nikhil Agrahari" })).toBeDefined();
    });

    const textarea = screen.getByPlaceholderText(/Paste your job description requirements/i);
    fireEvent.change(textarea, {
      target: {
        value: "Looking for a Senior TypeScript and React developer with Kubernetes experience.",
      },
    });

    const verifyButton = screen.getByRole("button", { name: /Verify Candidate Fit/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Verified Match Score/i)).toBeDefined();
      expect(screen.getByText(/Nikhil demonstrates a high match/i)).toBeDefined();
      expect(screen.getByText("Kubernetes")).toBeDefined();
    });
  });

  it("renders 404 state when profile does not exist or is set to private", async () => {
    vi.mocked(apiClient.getPublicTwinProfile).mockRejectedValueOnce(
      new Error("Profile '@secret_user' not found or is private.")
    );

    const onNavigate = vi.fn();
    render(<PublicTwinView username="secret_user" onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/Dossier Not Available/i)).toBeDefined();
      expect(screen.getByText(/secret_user/i)).toBeDefined();
    });
  });
});
