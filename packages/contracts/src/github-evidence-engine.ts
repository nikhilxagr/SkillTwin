import type { ResumeExtraction } from "./resume.js";
import type { SkillMatrix } from "./skills.js";
import {
  githubEvidenceReportSchema,
  type AnalyzedRepository,
  type SkillEvidenceComparison,
  type GithubEvidenceReport,
  type ProjectEvidenceStrength,
  type EvidenceConfidence,
  type EvidenceComparisonStatus,
} from "./github-evidence.js";

export interface CompareGithubEvidenceInput {
  resume?: ResumeExtraction | null;
  matrix?: SkillMatrix | null;
  repositories: AnalyzedRepository[];
  username: string;
}

const normalize = (val: string) => val.toLowerCase().trim();

/**
 * Checks if a specific skill is evidenced within an analyzed GitHub repository.
 */
export function isSkillEvidencedInRepo(skillName: string, repo: AnalyzedRepository): boolean {
  const norm = normalize(skillName);

  // 1. Language check
  if (repo.primaryLanguage && normalize(repo.primaryLanguage) === norm) {
    return true;
  }
  if (repo.languages.some((lang) => normalize(lang.name) === norm)) {
    return true;
  }

  // 2. Docker check
  if (norm.includes("docker") || norm.includes("container")) {
    if (repo.docker.detected || repo.docker.hasDockerfile || repo.docker.hasDockerCompose) {
      return true;
    }
  }

  // 3. Testing check
  if (norm.includes("test") || norm.includes("jest") || norm.includes("vitest") || norm.includes("cypress") || norm.includes("playwright")) {
    if (repo.testing.detected || repo.testing.testFileCount > 0) {
      return true;
    }
    if (repo.testing.frameworks.some((f) => normalize(f).includes(norm) || norm.includes(normalize(f)))) {
      return true;
    }
  }

  // 4. Cloud & Deployment (AWS / GCP / CI/CD)
  if (norm.includes("aws") || norm.includes("amazon")) {
    const platforms = repo.deployment?.platforms || (repo.deployment as any)?.providers || [];
    if (
      platforms.some((p: string) => normalize(p).includes("aws")) ||
      (repo.dependencies || []).some((d) => normalize(d.name).includes("aws-sdk") || normalize(d.name).includes("@aws-sdk"))
    ) {
      return true;
    }
  }

  if (norm.includes("ci") || norm.includes("github actions") || norm.includes("devops")) {
    const platforms = repo.deployment?.platforms || (repo.deployment as any)?.providers || [];
    if (repo.deployment?.detected || platforms.some((p: string) => normalize(p).includes("github actions"))) {
      return true;
    }
  }

  // 5. Dependency check
  if ((repo.dependencies || []).some((d) => {
    const depNorm = normalize(d.name);
    return depNorm === norm || depNorm.includes(norm) || norm.includes(depNorm);
  })) {
    return true;
  }

  // 6. Detected Technologies check
  const techs = repo.detectedTechnologies || (repo as any).technologies || [];
  if (techs.some((t: string) => {
    const techNorm = normalize(t);
    return techNorm === norm || techNorm.includes(norm) || norm.includes(techNorm);
  })) {
    return true;
  }

  // 7. Topics check
  if ((repo.topics || []).some((topic) => {
    const topicNorm = normalize(topic);
    return topicNorm === norm || topicNorm.includes(norm) || norm.includes(topicNorm);
  })) {
    return true;
  }

  return false;
}

/**
 * Phase 11: Compares Resume claims and Skill Matrix against connected GitHub repositories.
 * Identifies verified competencies and surfaces discrepancies using non-accusatory language.
 */
export function compareGithubEvidence(input: CompareGithubEvidenceInput): GithubEvidenceReport {
  const { resume, matrix, repositories, username } = input;

  // 1. Gather all resume skill claims
  const resumeSkillMap = new Map<string, { category: string; detail: string }>();

  if (matrix?.items) {
    for (const item of matrix.items) {
      resumeSkillMap.set(item.canonicalName, {
        category: item.category,
        detail: item.explanation || "Demonstrated in Skill Matrix profile.",
      });
    }
  }

  if (resume) {
    if (resume.skillsClaimed) {
      for (const s of resume.skillsClaimed) {
        if (!resumeSkillMap.has(s)) {
          resumeSkillMap.set(s, {
            category: "General",
            detail: "Claimed in resume skills section.",
          });
        }
      }
    }

    if (resume.projects) {
      for (const p of resume.projects) {
        for (const t of p.technologies || []) {
          if (!resumeSkillMap.has(t)) {
            resumeSkillMap.set(t, {
              category: "Projects",
              detail: `Demonstrated in project: ${p.name}`,
            });
          }
        }
      }
    }

    if (resume.experience) {
      for (const exp of resume.experience) {
        for (const t of exp.technologies || []) {
          if (!resumeSkillMap.has(t)) {
            resumeSkillMap.set(t, {
              category: "Experience",
              detail: `Used at ${exp.company}`,
            });
          }
        }
      }
    }
  }

  // Default fallback skills if empty profile
  if (resumeSkillMap.size === 0) {
    resumeSkillMap.set("React", { category: "Frontend", detail: "Claimed on resume." });
    resumeSkillMap.set("Node.js", { category: "Backend", detail: "Claimed on resume." });
    resumeSkillMap.set("TypeScript", { category: "Programming Languages", detail: "Claimed on resume." });
    resumeSkillMap.set("Docker", { category: "DevOps", detail: "Claimed on resume." });
    resumeSkillMap.set("AWS", { category: "Cloud", detail: "Claimed on resume." });
    resumeSkillMap.set("Testing", { category: "Testing", detail: "Claimed on resume." });
  }

  const comparisons: SkillEvidenceComparison[] = [];
  const processedSkills = new Set<string>();

  // 2. Evaluate Resume skills against GitHub
  for (const [skillName, meta] of resumeSkillMap.entries()) {
    processedSkills.add(normalize(skillName));

    const matchedRepos: string[] = [];
    for (const repo of repositories) {
      if (isSkillEvidencedInRepo(skillName, repo)) {
        matchedRepos.push(repo.name);
      }
    }

    const detectedRepoCount = matchedRepos.length;
    const hasGithubEvidence = detectedRepoCount > 0;

    let projectEvidence: ProjectEvidenceStrength = "None";
    let confidence: EvidenceConfidence = "Low";
    let status: EvidenceComparisonStatus = "DISCREPANCY";
    let discrepancyMessage: string | undefined;
    let recommendationTip: string | undefined;

    if (hasGithubEvidence) {
      if (detectedRepoCount >= 2) {
        projectEvidence = "Strong";
        confidence = "High";
        status = "VERIFIED";
      } else {
        projectEvidence = "Moderate";
        confidence = "Moderate";
        status = "VERIFIED";
      }
    } else {
      // Discrepancy detected: resume claims it, but no GitHub evidence is found
      projectEvidence = "None";
      confidence = "Low";
      status = "DISCREPANCY";
      // Exact phrasing constraint from user specification
      discrepancyMessage = `${skillName} is listed on your resume, but current connected evidence does not demonstrate it.`;
      recommendationTip = `Publish repositories featuring ${skillName}, link private code commits, or add verifiable deployment artifacts.`;
    }

    comparisons.push({
      canonicalName: skillName,
      category: meta.category,
      resumeEvidence: true,
      resumeEvidenceDetail: "Yes",
      githubEvidence: hasGithubEvidence,
      githubEvidenceDetail: hasGithubEvidence
        ? `Yes (${skillName} detected in ${detectedRepoCount} ${
            detectedRepoCount === 1 ? "repository" : "repositories"
          }: ${matchedRepos.join(", ")})`
        : "None detected across connected repositories",
      detectedRepoCount,
      detectedRepos: matchedRepos,
      projectEvidence,
      confidence,
      status,
      discrepancyMessage,
      recommendationTip,
    });
  }

  // 3. Scan for GitHub-only skills (detected in code but omitted from resume)
  for (const repo of repositories) {
    const techs = repo.detectedTechnologies || (repo as any).technologies || [];
    for (const tech of techs) {
      if (!processedSkills.has(normalize(tech))) {
        processedSkills.add(normalize(tech));

        const reposWithTech = repositories
          .filter((r) => isSkillEvidencedInRepo(tech, r))
          .map((r) => r.name);

        comparisons.push({
          canonicalName: tech,
          category: "GitHub Evidence",
          resumeEvidence: false,
          resumeEvidenceDetail: "Not explicitly listed on current resume",
          githubEvidence: true,
          githubEvidenceDetail: `Yes (Detected in ${reposWithTech.length} ${
            reposWithTech.length === 1 ? "repository" : "repositories"
          }: ${reposWithTech.join(", ")})`,
          detectedRepoCount: reposWithTech.length,
          detectedRepos: reposWithTech,
          projectEvidence: reposWithTech.length >= 2 ? "Strong" : "Moderate",
          confidence: reposWithTech.length >= 2 ? "High" : "Moderate",
          status: "GITHUB_ONLY",
          recommendationTip: `Consider adding ${tech} to your resume Technical Skills section; you already possess verified repository evidence.`,
        });
      }
    }
  }

  const discrepancies = comparisons.filter((c) => c.status === "DISCREPANCY");
  const verified = comparisons.filter((c) => c.status === "VERIFIED");
  const githubOnly = comparisons.filter((c) => c.status === "GITHUB_ONLY");

  const overallEvidenceStrength: "Strong" | "Moderate" | "Developing" =
    discrepancies.length === 0
      ? "Strong"
      : verified.length >= discrepancies.length
      ? "Moderate"
      : "Developing";

  const report: GithubEvidenceReport = {
    id: `gh-report-${Date.now()}`,
    username,
    connectedAt: new Date().toISOString(),
    totalRepositories: repositories.length,
    analyzedRepositories: repositories,
    comparisons,
    summary: {
      totalSkillsEvaluated: comparisons.length,
      verifiedCount: verified.length,
      discrepancyCount: discrepancies.length,
      githubOnlyCount: githubOnly.length,
      overallEvidenceStrength,
    },
    discrepancies,
  };

  return githubEvidenceReportSchema.parse(report);
}
