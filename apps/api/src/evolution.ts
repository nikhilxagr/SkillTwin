import type { Evolution } from "@skilltwin/contracts";

export const demoEvolution: Evolution = {
  snapshots: [
    { id: "snapshot-1", analyzedAt: "2026-07-01", label: "Initial baseline", evidenceConfidence: 58, skillsTracked: 2 },
    { id: "snapshot-2", analyzedAt: "2026-08-15", label: "API project added", evidenceConfidence: 66, skillsTracked: 3 },
    { id: "snapshot-3", analyzedAt: "2026-10-01", label: "Current snapshot", evidenceConfidence: 72, skillsTracked: 3 },
  ],
  changes: [
    {
      skill: "React",
      previousEstimate: 70,
      currentEstimate: 78,
      evidenceChange: "Two additional component implementations were detected.",
      interpretation: "Evidence coverage increased; this does not independently prove proficiency increased.",
    },
    {
      skill: "Testing",
      previousEstimate: 20,
      currentEstimate: 32,
      evidenceChange: "A small set of API tests appeared in the latest snapshot.",
      interpretation: "Testing evidence is emerging but remains below the target role expectation.",
    },
    {
      skill: "Docker",
      previousEstimate: 0,
      currentEstimate: 0,
      evidenceChange: "No new Docker implementation evidence was detected.",
      interpretation: "This remains a missing-evidence gap for the selected role.",
    },
  ],
  newEvidence: ["REST API implementation", "API endpoint tests", "Additional React components"],
  remainingGaps: ["Docker containerization", "Broader integration testing", "Authentication tradeoff documentation"],
  disclaimer: "Changes describe observed evidence and activity between snapshots. They are not proof of real-world proficiency growth.",
};
