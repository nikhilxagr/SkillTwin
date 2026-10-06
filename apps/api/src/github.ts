import type { GithubStatus, GithubSync } from "@skilltwin/contracts";

export const githubStatus: GithubStatus = {
  mode: "demo",
  connected: false,
  username: null,
  scopes: [],
  message: "No GitHub account connected. Connect a GitHub account or enter a public username to verify code evidence.",
};

export const demoGithubSync: GithubSync = {
  status: "completed",
  repositoriesAnalyzed: 0,
  evidence: [],
  limitations: [
    "No GitHub repository evidence loaded.",
  ],
};
