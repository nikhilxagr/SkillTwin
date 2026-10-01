import crypto from "node:crypto";
import type { AnalysisResult, SkillAssessment } from "@skilltwin/contracts";
import { demoGithubSync } from "./github.js";

type AnalysisInput = {
  resumeStatements?: string[];
};

export interface IntelligenceProvider {
  analyze(input: AnalysisInput): AnalysisResult;
}

function assessment(
  skill: string,
  confidenceEstimate: number,
  evidenceSources: SkillAssessment["evidenceSources"],
  explanation: string,
): SkillAssessment {
  return { skill, confidenceEstimate, evidenceSources, explanation };
}

export class DeterministicDemoProvider implements IntelligenceProvider {
  analyze(input: AnalysisInput): AnalysisResult {
    const hasResume = (input.resumeStatements ?? []).length > 0;
    const repositoryEvidence = demoGithubSync.evidence;
    const hasReactRepo = repositoryEvidence.some((repo) => repo.topics.includes("react"));
    const hasNodeRepo = repositoryEvidence.some((repo) => repo.topics.includes("nodejs"));
    const assessments = [
      assessment(
        "React",
        hasReactRepo ? 78 : 35,
        hasReactRepo ? ["github", "project"] : ["github"],
        hasReactRepo ? "Repository topics and implementation signals support repeated React evidence." : "No corroborating React repository signal was found.",
      ),
      assessment(
        "TypeScript",
        hasResume && repositoryEvidence.some((repo) => repo.languages.includes("TypeScript")) ? 64 : 42,
        hasResume ? ["resume", "github"] : ["github"],
        "Resume claims are paired with typed repository signals; this remains an estimate.",
      ),
      assessment(
        "Node.js",
        hasNodeRepo ? 58 : 30,
        hasNodeRepo ? ["github", "project"] : ["github"],
        hasNodeRepo ? "A Node.js REST API repository provides implementation evidence." : "No corroborating Node.js repository signal was found.",
      ),
    ];
    return {
      id: `analysis-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      provider: "deterministic-demo",
      status: "partial",
      assessments,
      evidenceCount: repositoryEvidence.length + (input.resumeStatements?.length ?? 0),
      limitations: [
        "The deterministic demo provider is used because no external AI credentials are configured.",
        "Confidence values are estimates derived from source signals, not objective proficiency measurements.",
        "Interview responses and repository counts are not treated as proof of skill.",
      ],
    };
  }
}

export const intelligenceProvider: IntelligenceProvider = new DeterministicDemoProvider();
