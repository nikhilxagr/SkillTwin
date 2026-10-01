import { demoTwin } from "./demo-twin.js";
import type { GapAnalysis, RoleProfile, GapAnalysis as TypedGapAnalysis } from "@skilltwin/contracts";

export const roles: RoleProfile[] = [
  {
    id: "full-stack-developer",
    name: "Full Stack Developer",
    description: "Builds reliable user experiences and the APIs behind them.",
    skills: [
      { skill: "React", targetEstimate: 80, importance: "required" },
      { skill: "TypeScript", targetEstimate: 75, importance: "required" },
      { skill: "Node.js", targetEstimate: 80, importance: "required" },
      { skill: "Testing", targetEstimate: 70, importance: "important" },
      { skill: "Docker", targetEstimate: 60, importance: "useful" },
    ],
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    description: "Creates accessible, performant interfaces for the web.",
    skills: [
      { skill: "React", targetEstimate: 80, importance: "required" },
      { skill: "TypeScript", targetEstimate: 75, importance: "required" },
      { skill: "Testing", targetEstimate: 70, importance: "important" },
    ],
  },
];

export function getGapAnalysis(roleId: string): GapAnalysis | undefined {
  const role = roles.find((candidate) => candidate.id === roleId);
  if (!role) return undefined;
  const results: TypedGapAnalysis["results"] = role.skills.map((requirement) => {
    const assessment = demoTwin.skills.find((skill) => skill.skill === requirement.skill);
    const currentEstimate = assessment?.confidenceEstimate ?? 0;
    const difference = requirement.targetEstimate - currentEstimate;
    const status: TypedGapAnalysis["results"][number]["status"] = !assessment
      ? "missing_evidence"
      : difference <= 5
        ? "strong"
        : difference <= 20
          ? "developing"
          : "gap";
    return {
      skill: requirement.skill,
      currentEstimate,
      targetEstimate: requirement.targetEstimate,
      status,
      importance: requirement.importance,
      rationale: !assessment
        ? "No supporting evidence is available in the current snapshot."
        : difference <= 5
          ? "Current evidence is close to the expected level for this role."
          : `The current estimate is ${difference} points below the role expectation.`,
    };
  });
  return {
    role,
    results,
    disclaimer: "These are AI-generated estimates based on available evidence, not objective proficiency measurements.",
  };
}
