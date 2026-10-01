import type { DeveloperTwin } from "@skilltwin/contracts";

export const demoTwin: DeveloperTwin = {
  profile: {
    name: "Nikhil's developer profile",
    headline: "Full Stack Developer",
    initials: "NX",
    yearsOfEvidence: 3,
  },
  summary: {
    evidenceConfidence: 72,
    connectedSources: 2,
    projectsAnalyzed: 6,
    lastAnalyzed: "Today",
  },
  skills: [
    {
      skill: "React",
      confidenceEstimate: 78,
      evidenceSources: ["github", "project"],
      evidenceSummary: "4 repositories · Hooks · Components",
      domain: "Frontend",
      subSkills: ["Hooks", "Components"],
      explanation: "Repeated implementation evidence across four repositories.",
    },
    {
      skill: "TypeScript",
      confidenceEstimate: 64,
      evidenceSources: ["resume", "github"],
      evidenceSummary: "3 repositories · Typed APIs",
      domain: "Frontend",
      subSkills: ["Typed APIs", "Interfaces"],
      explanation: "Claimed on the resume and observed in typed API code.",
    },
    {
      skill: "Node.js",
      confidenceEstimate: 58,
      evidenceSources: ["github", "project"],
      evidenceSummary: "2 repositories · REST services",
      domain: "Backend",
      subSkills: ["REST services", "Authentication"],
      explanation: "Backend activity is present, with limited testing evidence.",
    },
  ],
  nextAction: {
    title: "Turn Node.js activity into stronger evidence",
    description: "Add integration tests and document the authentication tradeoffs in your API project.",
    skill: "Node.js",
  },
};
