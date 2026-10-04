import type { ResumeExtraction } from "./resume.js";
import type { SkillMatrix, SkillMatrixItem } from "./skills.js";
import type { JobExtraction } from "./job.js";
import type { GapAnalysisReport, ComparisonItem } from "./gap.js";
import {
  careerReadinessReportSchema,
  type CareerReadinessReport,
  type CareerReadinessRating,
  type ReadinessScoreBreakdown,
  type ReadinessSkillCoverage,
  type ReadinessAreaItem,
  type EvidenceStrengthDistribution,
  type EvidenceTier,
  type TopJobGapItem,
  type NextBestAction,
} from "./readiness.js";

/**
 * Phase 8: Career Readiness Engine.
 *
 * Pure, deterministic and side-effect free so it can run on the API and in the
 * browser with identical results. It only aggregates data that already exists
 * in the Skill Matrix, Job Description and Gap Analysis — it never invents
 * skills, metrics or experience.
 */

export interface CareerReadinessInput {
  resume: ResumeExtraction | null;
  matrix: SkillMatrix;
  job?: JobExtraction | null;
  gapReport?: GapAnalysisReport | null;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const CATEGORY_ALIASES: Record<string, string> = {
  languages: "Programming Languages",
  "programming languages": "Programming Languages",
  databases: "Database",
  database: "Database",
  "cloud/devops": "DevOps",
  devops: "DevOps",
  cloud: "Cloud",
  cybersecurity: "Security",
  security: "Security",
};

export const normalizeReadinessCategory = (category: string): string => {
  const key = category.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? category.trim();
};

const lower = (value: string) => value.trim().toLowerCase();
const round = (value: number) => Math.round(value);
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((acc, v) => acc + v, 0) / values.length;
const slug = (value: string) => lower(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const TESTING_PATTERN = /\b(test|testing|jest|vitest|cypress|playwright|mocha|pytest|junit|tdd|e2e)\b/i;
const CONTAINER_PATTERN = /\b(docker|kubernetes|k8s|container|containers|containerization|helm|compose)\b/i;

const isTestingSkill = (name: string, category: string) =>
  normalizeReadinessCategory(category) === "Testing" || TESTING_PATTERN.test(name);
const isContainerSkill = (name: string) => CONTAINER_PATTERN.test(name);

const allGapItems = (gap: GapAnalysisReport): ComparisonItem[] => [
  ...gap.strongMatches,
  ...gap.partialGaps,
  ...gap.weakEvidence,
  ...gap.criticalGaps,
  ...gap.optionalGaps,
];

/** Credit a requirement receives toward coverage, based on its classification. */
const coverageCredit = (status: ComparisonItem["status"]): number => {
  switch (status) {
    case "MATCH":
      return 1;
    case "PARTIAL":
    case "WEAK_EVIDENCE":
      return 0.5;
    default:
      return 0;
  }
};

// ------------------------------------------------------------------
// 1. Skill coverage
// ------------------------------------------------------------------

const computeCoverage = (
  matrix: SkillMatrix,
  job: JobExtraction | null | undefined,
  gap: GapAnalysisReport | null | undefined
): ReadinessSkillCoverage => {
  if (gap) {
    const items = allGapItems(gap);
    const required = items.filter((i) => i.importance === "Required");
    const preferred = items.filter((i) => i.importance === "Preferred");
    const reqCredit = required.reduce((acc, i) => acc + coverageCredit(i.status), 0);
    const prefCredit = preferred.reduce((acc, i) => acc + coverageCredit(i.status), 0);
    const total = required.length + preferred.length;

    return {
      overallPercentage: total === 0 ? 0 : round(((reqCredit + prefCredit) / total) * 100),
      requiredPercentage: required.length === 0 ? 0 : round((reqCredit / required.length) * 100),
      preferredPercentage: preferred.length === 0 ? 0 : round((prefCredit / preferred.length) * 100),
      requiredTotal: required.length,
      requiredCovered: required.filter((i) => i.status === "MATCH").length,
      preferredTotal: preferred.length,
      preferredCovered: preferred.filter((i) => i.status === "MATCH").length,
      criticalGapsCount: gap.criticalGaps.length,
    };
  }

  if (job) {
    const byName = new Map(matrix.items.map((m) => [lower(m.canonicalName), m]));
    const credit = (name: string) => {
      const item = byName.get(lower(name));
      if (!item) return 0;
      return item.demonstrated ? 1 : 0.5;
    };
    const reqCredit = job.requiredSkills.reduce((acc, s) => acc + credit(s.canonicalName), 0);
    const prefCredit = job.preferredSkills.reduce((acc, s) => acc + credit(s.canonicalName), 0);
    const total = job.requiredSkills.length + job.preferredSkills.length;

    return {
      overallPercentage: total === 0 ? 0 : round(((reqCredit + prefCredit) / total) * 100),
      requiredPercentage:
        job.requiredSkills.length === 0 ? 0 : round((reqCredit / job.requiredSkills.length) * 100),
      preferredPercentage:
        job.preferredSkills.length === 0 ? 0 : round((prefCredit / job.preferredSkills.length) * 100),
      requiredTotal: job.requiredSkills.length,
      requiredCovered: job.requiredSkills.filter((s) => credit(s.canonicalName) === 1).length,
      preferredTotal: job.preferredSkills.length,
      preferredCovered: job.preferredSkills.filter((s) => credit(s.canonicalName) === 1).length,
      criticalGapsCount: job.requiredSkills.filter((s) => credit(s.canonicalName) === 0).length,
    };
  }

  // No job context: coverage reflects how much of the profile is demonstrated.
  const total = matrix.items.length;
  const demonstrated = matrix.items.filter((m) => m.demonstrated).length;
  const pct = total === 0 ? 0 : round((demonstrated / total) * 100);
  return {
    overallPercentage: pct,
    requiredPercentage: 0,
    preferredPercentage: 0,
    requiredTotal: 0,
    requiredCovered: 0,
    preferredTotal: 0,
    preferredCovered: 0,
    criticalGapsCount: 0,
  };
};

// ------------------------------------------------------------------
// 2. Evidence strength
// ------------------------------------------------------------------

type TierKey = EvidenceTier["tier"];

const strongestEvidenceTier = (item: SkillMatrixItem): TierKey => {
  const sources = new Set(item.evidence.map((e) => e.sourceType));
  if (sources.has("work_experience")) return "work_experience";
  if (sources.has("project") || sources.has("github")) return "project";
  if (sources.has("education") || sources.has("certification")) return "education_certification";
  return "claimed_only";
};

const TIER_LABELS: Record<TierKey, string> = {
  work_experience: "Work experience",
  project: "Projects",
  education_certification: "Education / certification",
  claimed_only: "Listed only (no supporting context)",
};

const computeEvidenceStrength = (matrix: SkillMatrix): EvidenceStrengthDistribution => {
  const buckets: Record<TierKey, string[]> = {
    work_experience: [],
    project: [],
    education_certification: [],
    claimed_only: [],
  };
  for (const item of matrix.items) {
    buckets[strongestEvidenceTier(item)].push(item.canonicalName);
  }

  const total = matrix.items.length;
  const order: TierKey[] = ["work_experience", "project", "education_certification", "claimed_only"];
  const tiers: EvidenceTier[] = order.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    skillCount: buckets[tier].length,
    percentage: total === 0 ? 0 : round((buckets[tier].length / total) * 100),
    skills: buckets[tier],
  }));

  return {
    tiers,
    averageConfidence: round(average(matrix.items.map((m) => m.confidence))),
    totalSkills: total,
    totalEvidenceItems: matrix.items.reduce((acc, m) => acc + m.evidence.length, 0),
    singleSourceSkillCount: matrix.items.filter((m) => m.evidence.length <= 1).length,
  };
};

// ------------------------------------------------------------------
// 3. Overall readiness
// ------------------------------------------------------------------

const ratingFor = (score: number): CareerReadinessRating => {
  if (score >= 80) return "Job Ready";
  if (score >= 65) return "Competitive";
  if (score >= 50) return "Developing";
  return "Needs Targeted Prep";
};

const computeScore = (
  coverage: ReadinessSkillCoverage,
  evidence: EvidenceStrengthDistribution,
  gap: GapAnalysisReport | null | undefined,
  hasJobContext: boolean
): { score: number; breakdown: ReadinessScoreBreakdown } => {
  if (hasJobContext) {
    const alignment = gap ? gap.summary.alignmentScore : coverage.overallPercentage;
    const alignmentComponent = alignment * 0.4;
    const coverageComponent = coverage.requiredPercentage * 0.3;
    const evidenceComponent = evidence.averageConfidence * 0.3;
    const criticalGapPenalty = Math.min(coverage.criticalGapsCount * 4, 16);
    const score = round(clamp(alignmentComponent + coverageComponent + evidenceComponent - criticalGapPenalty));
    return {
      score,
      breakdown: {
        alignmentComponent: round(alignmentComponent),
        coverageComponent: round(coverageComponent),
        evidenceComponent: round(evidenceComponent),
        criticalGapPenalty,
        formula:
          "40% job alignment + 30% required-skill coverage + 30% average evidence confidence − 4 pts per critical gap (max −16)",
        hasJobContext: true,
      },
    };
  }

  const evidenceComponent = evidence.averageConfidence * 0.6;
  const coverageComponent = coverage.overallPercentage * 0.4;
  const score = round(clamp(evidenceComponent + coverageComponent));
  return {
    score,
    breakdown: {
      alignmentComponent: 0,
      coverageComponent: round(coverageComponent),
      evidenceComponent: round(evidenceComponent),
      criticalGapPenalty: 0,
      formula:
        "No target job selected: 60% average evidence confidence + 40% share of skills with demonstrated evidence",
      hasJobContext: false,
    },
  };
};

// ------------------------------------------------------------------
// 4/5. Strongest & weakest areas
// ------------------------------------------------------------------

interface CategoryGroup {
  category: string;
  items: SkillMatrixItem[];
}

const groupByCategory = (matrix: SkillMatrix): CategoryGroup[] => {
  const map = new Map<string, SkillMatrixItem[]>();
  for (const item of matrix.items) {
    const cat = normalizeReadinessCategory(item.category);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
};

const jobCategories = (
  job: JobExtraction | null | undefined,
  gap: GapAnalysisReport | null | undefined
): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  const add = (category: string, skill: string) => {
    const cat = normalizeReadinessCategory(category);
    if (!map.has(cat)) map.set(cat, []);
    const list = map.get(cat)!;
    if (!list.some((s) => lower(s) === lower(skill))) list.push(skill);
  };
  if (job) {
    for (const s of [...job.requiredSkills, ...job.preferredSkills]) add(s.category, s.canonicalName);
  } else if (gap) {
    for (const i of allGapItems(gap)) add(i.category, i.canonicalName);
  }
  return map;
};

const areaStatus = (confidence: number): ReadinessAreaItem["status"] => {
  if (confidence >= 75) return "STRONG";
  if (confidence >= 50) return "DEVELOPING";
  return "WEAK";
};

const buildArea = (
  group: CategoryGroup,
  jobRelevant: boolean,
  missingJobSkills: string[]
): ReadinessAreaItem => {
  const confidence = round(average(group.items.map((i) => i.confidence)));
  const demonstrated = group.items.filter((i) => i.demonstrated).length;
  const workBacked = group.items.filter((i) => strongestEvidenceTier(i) === "work_experience").length;
  const projectBacked = group.items.filter((i) => strongestEvidenceTier(i) === "project").length;

  let evidenceSummary: string;
  if (group.items.length === 0) {
    evidenceSummary = `No ${group.category} skills were found in your resume. The target job asks for: ${missingJobSkills.join(", ")}.`;
  } else {
    const parts = [
      `${demonstrated} of ${group.items.length} skill${group.items.length === 1 ? "" : "s"} demonstrated`,
    ];
    if (workBacked > 0) parts.push(`${workBacked} backed by work experience`);
    if (projectBacked > 0) parts.push(`${projectBacked} backed by projects`);
    evidenceSummary = `${parts.join(" · ")}.`;
    if (missingJobSkills.length > 0) {
      evidenceSummary += ` Job also asks for: ${missingJobSkills.join(", ")}.`;
    }
  }

  return {
    id: `area-${slug(group.category)}`,
    areaName: group.category,
    category: group.category,
    skills: group.items.length > 0 ? group.items.map((i) => i.canonicalName) : missingJobSkills,
    confidenceScore: confidence,
    demonstratedCount: demonstrated,
    totalCount: group.items.length,
    status: group.items.length === 0 ? "WEAK" : areaStatus(confidence),
    evidenceSummary,
    jobRelevant,
  };
};

const computeAreas = (
  matrix: SkillMatrix,
  job: JobExtraction | null | undefined,
  gap: GapAnalysisReport | null | undefined
): { strongest: ReadinessAreaItem[]; weakest: ReadinessAreaItem[] } => {
  const groups = groupByCategory(matrix).filter((g) => g.category !== "Soft Skills");
  const jobCats = jobCategories(job, gap);
  const hasJob = jobCats.size > 0;
  const candidateNames = new Set(matrix.items.map((m) => lower(m.canonicalName)));

  const missingFor = (category: string) =>
    (jobCats.get(category) ?? []).filter((s) => !candidateNames.has(lower(s)));

  const areas = groups.map((g) => buildArea(g, jobCats.has(g.category), missingFor(g.category)));

  // Job categories in which the candidate has no skills at all.
  for (const [category, skills] of jobCats) {
    if (category === "Soft Skills") continue;
    if (!groups.some((g) => g.category === category)) {
      areas.push(buildArea({ category, items: [] }, true, skills));
    }
  }

  const strongest = areas
    .filter((a) => a.totalCount > 0 && a.demonstratedCount > 0 && a.status !== "WEAK")
    .sort((a, b) => {
      if (hasJob && a.jobRelevant !== b.jobRelevant) return a.jobRelevant ? -1 : 1;
      return b.confidenceScore - a.confidenceScore || b.demonstratedCount - a.demonstratedCount;
    })
    .slice(0, 3);

  const strongestIds = new Set(strongest.map((a) => a.id));
  const weakestPool = areas.filter((a) => !strongestIds.has(a.id) && (!hasJob || a.jobRelevant));
  const weakest = weakestPool
    .sort((a, b) => {
      // Categories with missing job skills first, then lowest confidence.
      const aMissing = a.totalCount === 0 ? 1 : 0;
      const bMissing = b.totalCount === 0 ? 1 : 0;
      return bMissing - aMissing || a.confidenceScore - b.confidenceScore;
    })
    .filter((a) => a.status !== "STRONG")
    .slice(0, 3);

  return { strongest, weakest };
};

// ------------------------------------------------------------------
// 6. Top job gaps
// ------------------------------------------------------------------

const computeTopGaps = (
  matrix: SkillMatrix,
  job: JobExtraction | null | undefined,
  gap: GapAnalysisReport | null | undefined
): TopJobGapItem[] => {
  if (gap) {
    const candidates = [...gap.criticalGaps, ...gap.weakEvidence, ...gap.partialGaps];
    return candidates
      .sort((a, b) => {
        if (a.importance !== b.importance) return a.importance === "Required" ? -1 : 1;
        return b.priorityScore - a.priorityScore;
      })
      .slice(0, 5)
      .map((g) => ({
        id: `gap-${slug(g.canonicalName)}`,
        skill: g.canonicalName,
        category: g.category,
        importance: g.importance,
        status: g.status === "GAP" ? "GAP" : g.status === "WEAK_EVIDENCE" ? "WEAK_EVIDENCE" : "PARTIAL",
        requiredProficiency: g.requiredProficiency,
        currentProficiency: g.candidateProficiency,
        priorityLevel: g.priority,
        priorityScore: g.priorityScore,
        gapRationale: g.gapRationale,
        actionTip: g.suggestedAction,
      }));
  }

  if (job) {
    const byName = new Map(matrix.items.map((m) => [lower(m.canonicalName), m]));
    const gaps: TopJobGapItem[] = [];
    for (const req of [...job.requiredSkills, ...job.preferredSkills]) {
      const item = byName.get(lower(req.canonicalName));
      if (item && item.demonstrated) continue;
      const isRequired = req.importance === "Required";
      const missing = !item;
      const score = isRequired ? (missing ? 80 : 60) : missing ? 40 : 30;
      gaps.push({
        id: `gap-${slug(req.canonicalName)}`,
        skill: req.canonicalName,
        category: req.category,
        importance: req.importance,
        status: missing ? "GAP" : "WEAK_EVIDENCE",
        requiredProficiency: req.minimumProficiency,
        currentProficiency: item ? item.proficiency : "Not Detected",
        priorityLevel: score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 35 ? "Medium" : "Low",
        priorityScore: score,
        gapRationale: missing
          ? `${req.canonicalName} is ${lower(req.importance)} for this role and does not appear in your resume.`
          : `${req.canonicalName} is listed in your resume but no project or work context supports it.`,
        actionTip: missing
          ? `Build hands-on experience with ${req.canonicalName} before claiming it.`
          : `Describe where you actually used ${req.canonicalName} in a project or role.`,
      });
    }
    return gaps.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  }

  return [];
};

// ------------------------------------------------------------------
// 7. Next best actions
// ------------------------------------------------------------------

interface ActionCandidate {
  action: Omit<NextBestAction, "rank">;
  weight: number;
}

const priorityFromScore = (score: number): NextBestAction["priority"] =>
  score >= 75 ? "Critical" : score >= 55 ? "High" : "Recommended";

const computeNextBestActions = (
  matrix: SkillMatrix,
  gaps: TopJobGapItem[],
  gap: GapAnalysisReport | null | undefined,
  evidence: EvidenceStrengthDistribution
): NextBestAction[] => {
  const candidates: ActionCandidate[] = [];
  const consumed = new Set<string>();

  // Use the full gap list (not just the top 5) for rule detection.
  const gapPool: TopJobGapItem[] = gap
    ? [...gap.criticalGaps, ...gap.weakEvidence, ...gap.partialGaps].map((g) => ({
        id: `gap-${slug(g.canonicalName)}`,
        skill: g.canonicalName,
        category: g.category,
        importance: g.importance,
        status: g.status === "GAP" ? "GAP" : g.status === "WEAK_EVIDENCE" ? "WEAK_EVIDENCE" : "PARTIAL",
        requiredProficiency: g.requiredProficiency,
        currentProficiency: g.candidateProficiency,
        priorityLevel: g.priority,
        priorityScore: g.priorityScore,
        gapRationale: g.gapRationale,
        actionTip: g.suggestedAction,
      }))
    : gaps;

  // Rule A — Testing evidence
  const testingGaps = gapPool.filter((g) => isTestingSkill(g.skill, g.category));
  const testingSkillsInMatrix = matrix.items.filter((m) => isTestingSkill(m.canonicalName, m.category));
  const weakTestingInMatrix = testingSkillsInMatrix.filter((m) => !m.demonstrated || m.confidence < 50);
  if (testingGaps.length > 0 || (testingSkillsInMatrix.length > 0 && weakTestingInMatrix.length === testingSkillsInMatrix.length)) {
    const skills = testingGaps.length > 0 ? testingGaps.map((g) => g.skill) : weakTestingInMatrix.map((m) => m.canonicalName);
    const topScore = testingGaps.length > 0 ? Math.max(...testingGaps.map((g) => g.priorityScore)) : 50;
    skills.forEach((s) => consumed.add(lower(s)));
    candidates.push({
      weight: topScore + 5,
      action: {
        id: "action-testing-evidence",
        title: "Improve testing evidence",
        category: "Testing",
        priority: priorityFromScore(topScore),
        relatedSkills: skills,
        whyItMatters:
          testingGaps.length > 0
            ? "The target job lists automated testing, and your resume does not yet show test suites you have written."
            : "Testing appears in your resume, but nothing shows where or how you applied it.",
        evidenceBasis:
          testingGaps.length > 0
            ? testingGaps
                .map((g) => `${g.skill}: ${g.importance}, current ${g.currentProficiency} (priority ${g.priorityScore}/100)`)
                .join(" · ")
            : weakTestingInMatrix.map((m) => `${m.canonicalName}: ${m.confidence}% confidence`).join(" · "),
        actionSteps: [
          "Add unit and integration tests to one project you already own.",
          "Run them in CI so the repository shows passing test runs.",
          "Then mention the tests in that project's bullet — describe only what you actually wrote.",
        ],
        targetScreen: "gap_analysis",
        actionButtonText: "View testing gaps",
      },
    });
  }

  // Rule B — Container / Docker project
  const containerGaps = gapPool.filter((g) => isContainerSkill(g.skill) && !consumed.has(lower(g.skill)));
  if (containerGaps.length > 0) {
    const topScore = Math.max(...containerGaps.map((g) => g.priorityScore));
    containerGaps.forEach((g) => consumed.add(lower(g.skill)));
    candidates.push({
      weight: topScore,
      action: {
        id: "action-docker-project",
        title: "Build a Docker-based project",
        category: "DevOps",
        priority: priorityFromScore(topScore),
        relatedSkills: containerGaps.map((g) => g.skill),
        whyItMatters:
          "The target job expects containerized delivery. A repository with a working Dockerfile is concrete, reviewable evidence.",
        evidenceBasis: containerGaps
          .map((g) => `${g.skill}: ${g.importance}, current ${g.currentProficiency} (priority ${g.priorityScore}/100)`)
          .join(" · "),
        actionSteps: [
          "Containerize an existing project with a multi-stage Dockerfile.",
          "Add a docker-compose file that starts the app together with its database.",
          "Document how to run it in the README, then reference the project on your resume.",
        ],
        targetScreen: "gap_analysis",
        actionButtonText: "View DevOps gaps",
      },
    });
  }

  // Rule C — Strengthen fundamentals for required skills the candidate has, but weakly.
  const weakRequired = gapPool
    .filter(
      (g) =>
        g.importance === "Required" &&
        (g.status === "PARTIAL" || g.status === "WEAK_EVIDENCE") &&
        !consumed.has(lower(g.skill))
    )
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 2);
  for (const g of weakRequired) {
    consumed.add(lower(g.skill));
    candidates.push({
      weight: g.priorityScore,
      action: {
        id: `action-strengthen-${slug(g.skill)}`,
        title: `Strengthen ${g.skill} fundamentals`,
        category: g.category,
        priority: priorityFromScore(g.priorityScore),
        relatedSkills: [g.skill],
        whyItMatters: `${g.skill} is required for this role. You are at ${g.currentProficiency}; the job expects ${g.requiredProficiency}.`,
        evidenceBasis: g.gapRationale,
        actionSteps: [
          `Pick one feature in an existing project and implement it more deeply with ${g.skill}.`,
          g.actionTip,
          `Once done, update that project's description with what you built — no estimated metrics.`,
        ],
        targetScreen: "skill_matrix",
        actionButtonText: `Review ${g.skill} evidence`,
      },
    });
  }

  // Rule D — Missing required skills not covered above.
  const missingRequired = gapPool
    .filter((g) => g.importance === "Required" && g.status === "GAP" && !consumed.has(lower(g.skill)))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 1);
  for (const g of missingRequired) {
    consumed.add(lower(g.skill));
    candidates.push({
      weight: g.priorityScore - 2,
      action: {
        id: `action-learn-${slug(g.skill)}`,
        title: `Build first evidence of ${g.skill}`,
        category: g.category,
        priority: priorityFromScore(g.priorityScore),
        relatedSkills: [g.skill],
        whyItMatters: `${g.skill} is required and not present in your resume. Do not add it until you have used it.`,
        evidenceBasis: g.gapRationale,
        actionSteps: [
          `Learn the core concepts of ${g.skill}.`,
          g.actionTip,
          `Add ${g.skill} to your resume only after a project demonstrates it.`,
        ],
        targetScreen: "gap_analysis",
        actionButtonText: "Open gap analysis",
      },
    });
  }

  // Rule E — Stronger project evidence for listed-only / single-source skills.
  const claimedOnly = evidence.tiers.find((t) => t.tier === "claimed_only");
  const claimedSkills = (claimedOnly?.skills ?? []).filter((s) => !consumed.has(lower(s)));
  if (claimedSkills.length > 0 || evidence.singleSourceSkillCount > 0) {
    const shown = claimedSkills.slice(0, 5);
    candidates.push({
      weight: 40 + Math.min(claimedSkills.length * 3, 15),
      action: {
        id: "action-project-evidence",
        title: "Add stronger project evidence",
        category: "Evidence",
        priority: claimedSkills.length >= 3 ? "High" : "Recommended",
        relatedSkills: shown,
        whyItMatters:
          "Skills that are only listed, without project or work context, carry little weight with reviewers and are hard to defend in interviews.",
        evidenceBasis: [
          claimedSkills.length > 0 ? `${claimedSkills.length} skill(s) listed without supporting context` : null,
          evidence.singleSourceSkillCount > 0
            ? `${evidence.singleSourceSkillCount} skill(s) supported by a single mention`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        actionSteps: [
          shown.length > 0
            ? `For each of ${shown.join(", ")}: add a project or role bullet showing where you used it.`
            : "Expand single-mention skills with the project or role where you used them.",
          "Remove skills from your resume that you cannot back with real work.",
          "Use the tailored resume view to keep the most relevant evidence near the top.",
        ],
        targetScreen: "resume_improvement",
        actionButtonText: "Open resume recommendations",
      },
    });
  }

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((c, index) => ({ ...c.action, rank: index + 1 }));
};

// ------------------------------------------------------------------
// 8. Executive summary
// ------------------------------------------------------------------

const buildSummary = (
  score: number,
  rating: CareerReadinessRating,
  coverage: ReadinessSkillCoverage,
  strongest: ReadinessAreaItem[],
  weakest: ReadinessAreaItem[],
  targetRole: string | undefined,
  hasJobContext: boolean
): string => {
  const parts: string[] = [];
  parts.push(
    hasJobContext && targetRole
      ? `Readiness for ${targetRole}: ${score}/100 (${rating}).`
      : `Profile readiness: ${score}/100 (${rating}). Select a target job for role-specific readiness.`
  );
  if (hasJobContext && coverage.requiredTotal > 0) {
    parts.push(
      `${coverage.requiredCovered} of ${coverage.requiredTotal} required skills fully matched` +
        (coverage.criticalGapsCount > 0 ? `, ${coverage.criticalGapsCount} critical gap(s).` : ".")
    );
  }
  if (strongest.length > 0) parts.push(`Strongest: ${strongest.map((a) => a.areaName).join(", ")}.`);
  if (weakest.length > 0) parts.push(`Focus next on: ${weakest.map((a) => a.areaName).join(", ")}.`);
  return parts.join(" ");
};

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

export const computeCareerReadiness = (
  input: CareerReadinessInput,
  now: Date = new Date()
): CareerReadinessReport => {
  const { resume, matrix, job, gapReport } = input;
  const hasJobContext = Boolean(job || gapReport);

  const coverage = computeCoverage(matrix, job, gapReport);
  const evidence = computeEvidenceStrength(matrix);
  const { score, breakdown } = computeScore(coverage, evidence, gapReport, hasJobContext);
  const rating = ratingFor(score);
  const { strongest, weakest } = computeAreas(matrix, job, gapReport);
  const topJobGaps = computeTopGaps(matrix, job, gapReport);
  const nextBestActions = computeNextBestActions(matrix, topJobGaps, gapReport, evidence);

  const targetRole = job?.title ?? gapReport?.targetRole;
  const targetCompany = job?.company ?? gapReport?.company;

  const report: CareerReadinessReport = {
    id: `readiness-${matrix.resumeId}-${job?.id ?? gapReport?.jobId ?? "profile"}`,
    candidateName: resume?.profile.name || "Developer",
    targetRole,
    targetCompany,
    overallScore: score,
    overallRating: rating,
    scoreBreakdown: breakdown,
    executiveSummary: buildSummary(score, rating, coverage, strongest, weakest, targetRole, hasJobContext),
    skillCoverage: coverage,
    strongestAreas: strongest,
    weakestAreas: weakest,
    topJobGaps,
    evidenceStrength: evidence,
    nextBestActions,
    evaluatedAt: now.toISOString(),
  };

  return careerReadinessReportSchema.parse(report);
};
