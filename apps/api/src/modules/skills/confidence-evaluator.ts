import crypto from "node:crypto";
import type {
  CanonicalSkillDefinition,
  EvidenceItem,
  SkillEvidenceLevel,
  SkillProficiency,
  ConfidenceFactors,
} from "@skilltwin/contracts";

export interface ProjectCorroboration {
  projectName: string;
  bulletMentions: string[];
  inTechList: boolean;
}

export interface ExperienceCorroboration {
  company: string;
  role: string;
  bulletMentions: string[];
  inTechList: boolean;
  isCurrent: boolean;
}

export interface EvaluationInput {
  canonicalSkill: CanonicalSkillDefinition;
  isClaimed: boolean;
  projectCorroborations: ProjectCorroboration[];
  experienceCorroborations: ExperienceCorroboration[];
  allDetectedSkills: Set<string>;
}

export interface EvaluationResult {
  confidence: number;
  factors: ConfidenceFactors;
  evidenceLevel: SkillEvidenceLevel;
  proficiency: SkillProficiency;
  evidence: EvidenceItem[];
  missingEvidence: string[];
  explanation: string;
}

export class ConfidenceEvaluator {
  evaluate(input: EvaluationInput): EvaluationResult {
    const { canonicalSkill, isClaimed, projectCorroborations, experienceCorroborations, allDetectedSkills } = input;

    let directClaimScore = 0;
    let projectScore = 0;
    let experienceScore = 0;
    let ecosystemScore = 0;
    let recencyScore = 0;

    const evidence: EvidenceItem[] = [];

    // 1. Direct Skills Section Claim
    if (isClaimed) {
      directClaimScore = 25;
      evidence.push({
        id: `ev-${crypto.randomUUID()}`,
        sourceType: "skills_section",
        context: `Explicitly claimed under Technical Skills section`,
        weight: 25,
        verified: true,
      });
    }

    // 2. Project Corroborations
    if (projectCorroborations.length > 0) {
      projectCorroborations.forEach((proj) => {
        const bulletContext = proj.bulletMentions[0] || `Implemented in project: ${proj.projectName}`;
        const weight = Math.min(35, 20 + proj.bulletMentions.length * 5);
        projectScore = Math.max(projectScore, weight);

        evidence.push({
          id: `ev-${crypto.randomUUID()}`,
          sourceType: "project",
          sourceTitle: proj.projectName,
          context: bulletContext,
          weight,
          verified: true,
        });
      });
    }

    // 3. Commercial Experience Corroborations
    if (experienceCorroborations.length > 0) {
      experienceCorroborations.forEach((exp) => {
        const bulletContext = exp.bulletMentions[0] || `Utilized professionally at ${exp.company} as ${exp.role}`;
        const weight = 35;
        experienceScore = Math.max(experienceScore, weight);

        if (exp.isCurrent) {
          recencyScore = 5;
        }

        evidence.push({
          id: `ev-${crypto.randomUUID()}`,
          sourceType: "work_experience",
          sourceTitle: exp.company,
          context: bulletContext,
          weight,
          verified: true,
        });
      });
    }

    // 4. Ecosystem Partner Synergies
    const hasEcosystemPartner = canonicalSkill.ecosystemPartners.some((partner: string) =>
      allDetectedSkills.has(partner.toLowerCase())
    );
    if (hasEcosystemPartner && (projectCorroborations.length > 0 || experienceCorroborations.length > 0)) {
      ecosystemScore = 10;
    }

    // 5. Total Confidence Calculation
    const totalScore = Math.min(
      98,
      Math.max(isClaimed ? 25 : 15, directClaimScore + projectScore + experienceScore + ecosystemScore + recencyScore)
    );

    // 6. Evidence Level Determination
    let evidenceLevel: SkillEvidenceLevel = "ClaimedOnly";
    if (experienceCorroborations.length > 0 || projectCorroborations.length > 0) {
      if (totalScore >= 50) {
        evidenceLevel = "Demonstrated";
      } else {
        evidenceLevel = "WeakEvidence";
      }
    } else {
      evidenceLevel = "ClaimedOnly";
    }

    // 7. Proficiency Determination
    let proficiency: SkillProficiency = "Weak";
    if (totalScore >= 80) {
      proficiency = "Strong";
    } else if (totalScore >= 55) {
      proficiency = "Intermediate";
    } else if (totalScore >= 30) {
      proficiency = "Beginner";
    }

    // 8. Missing Evidence Recommendations
    const missingEvidence: string[] = [];
    if (canonicalSkill.category === "Frontend" && !allDetectedSkills.has("automated testing")) {
      missingEvidence.push("Component test suite (Vitest or React Testing Library)");
    }
    if (canonicalSkill.category === "Backend" && !allDetectedSkills.has("docker")) {
      missingEvidence.push("Containerized deployment configuration (Dockerfile / Compose)");
    }
    if (canonicalSkill.category === "Cloud/DevOps" && !allDetectedSkills.has("ci/cd")) {
      missingEvidence.push("Automated CI/CD pipeline workflow (GitHub Actions or GitLab CI)");
    }
    if (canonicalSkill.category === "Databases" && !allDetectedSkills.has("sql")) {
      missingEvidence.push("Complex relational query optimization or schema migration scripts");
    }
    if (evidenceLevel === "ClaimedOnly") {
      missingEvidence.push("Concrete open-source repository or commercial production deployment proof");
    }
    if (evidenceLevel === "WeakEvidence") {
      missingEvidence.push("Detailed implementation metrics, latency improvements, or architecture responsibilities");
    }

    // 9. Explanation
    let explanation = "";
    if (evidenceLevel === "Demonstrated") {
      const sourceCount = projectCorroborations.length + experienceCorroborations.length;
      explanation = `Demonstrated across ${sourceCount} verified engineering source(s) with active code and production deployment context.`;
    } else if (evidenceLevel === "WeakEvidence") {
      explanation = `Mentioned in resume, but bullet points lack architectural depth, performance metrics, and verifiable implementation details.`;
    } else {
      explanation = `Claimed solely in skills keyword list with zero commercial or project implementation references detected.`;
    }

    return {
      confidence: totalScore,
      factors: {
        directClaim: directClaimScore,
        projectCorroboration: projectScore,
        commercialExperience: experienceScore,
        ecosystemSynergies: ecosystemScore,
        recencyBonus: recencyScore,
        totalScore,
      },
      evidenceLevel,
      proficiency,
      evidence,
      missingEvidence,
      explanation,
    };
  }
}

export const confidenceEvaluator = new ConfidenceEvaluator();
