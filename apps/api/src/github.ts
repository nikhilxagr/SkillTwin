import type { GithubStatus, GithubSync } from "@skilltwin/contracts";

export const githubStatus: GithubStatus = {
  mode: "demo",
  connected: false,
  username: null,
  scopes: [],
  message: "Demo mode is active. Connect GitHub OAuth after configuring server credentials.",
};

export const demoGithubSync: GithubSync = {
  status: "partial",
  repositoriesAnalyzed: 3,
  evidence: [
    {
      id: "repo-skilltwin-dashboard",
      fullName: "demo/developer-dashboard",
      description: "A component-driven developer dashboard.",
      languages: ["TypeScript", "CSS"],
      topics: ["react", "frontend"],
      signals: { readme: "documented", testing: "partial", documentation: "present", activity: "active" },
      evidenceSummary: "React components and typed UI boundaries were detected across active commits.",
    },
    {
      id: "repo-api-service",
      fullName: "demo/api-service",
      description: "A REST API with typed request validation.",
      languages: ["TypeScript"],
      topics: ["nodejs", "rest-api"],
      signals: { readme: "basic", testing: "present", documentation: "partial", activity: "steady" },
      evidenceSummary: "Node.js API routes, validation, and endpoint tests provide implementation evidence.",
    },
    {
      id: "repo-experiments",
      fullName: "demo/experiments",
      description: null,
      languages: ["JavaScript"],
      topics: [],
      signals: { readme: "missing", testing: "not_detected", documentation: "not_detected", activity: "low" },
      evidenceSummary: "Small experiments were detected but provide limited demonstrated-skill evidence.",
    },
  ],
  limitations: [
    "This is seeded demo data and is not connected to a real GitHub account.",
    "Repository counts are not used as a proxy for proficiency.",
    "Private repositories require explicit OAuth authorization before analysis.",
  ],
};
