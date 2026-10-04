import { randomUUID } from "node:crypto";
import type {
  SkillMatrix,
  SkillMatrixItem,
  JobExtraction,
  JobSkillRequirement,
  GapAnalysisReport,
  ComparisonItem,
  GapCategory,
  SkillProficiency,
  JobImportance,
  SkillCategory,
  GapPriorityLevel,
  PriorityFactorBreakdown,
  ScoringModelExplanation,
} from "@skilltwin/contracts";
import { skillNormalizer, SkillNormalizer } from "../skills/skill-normalizer.js";
import { skillRegistry, SkillRegistry } from "../skills/skill-registry.js";
import { gapInterpreter, GapInterpreter } from "../../services/ai/index.js";

export interface CompareEngineOptions {
  useAiInterpretation?: boolean;
}

export class GapEngine {
  constructor(
    private readonly normalizer: SkillNormalizer = skillNormalizer,
    private readonly registry: SkillRegistry = skillRegistry,
    private readonly interpreter: GapInterpreter = gapInterpreter,
  ) {}

  /**
   * Convert textual proficiency to numeric rank for deterministic comparison:
   * Foundational (1) < Intermediate (2) < Strong (3) < Expert (4)
   */
  private proficiencyToRank(proficiency: SkillProficiency | "Not Detected" | string): number {
    switch (proficiency) {
      case "Expert":
        return 4;
      case "Strong":
        return 3;
      case "Intermediate":
        return 2;
      case "Beginner":
      case "Foundational":
        return 1;
      case "Weak":
        return 0.5;
      default:
        return 0;
    }
  }

  /**
   * Detect technical ecosystem synergy between a target skill requirement
   * and a candidate's existing demonstrated skills.
   *
   * Closing a gap that builds directly on already demonstrated technologies
   * yields the highest ROI and interview qualification leverage.
   */
  private findEcosystemSynergies(
    canonicalName: string,
    category: SkillCategory,
    candidateSkills: SkillMatrixItem[],
  ): { score: number; related: string[]; explanation: string } {
    const lowerTarget = canonicalName.toLowerCase();
    const relatedNames: string[] = [];

    // 1. Check Skill Registry explicit related skills / ecosystem partners
    const def = this.registry.getSkill(canonicalName);
    if (def && def.ecosystemPartners) {
      for (const rel of def.ecosystemPartners) {
        const match = candidateSkills.find(
          (cs) =>
            cs.canonicalName.toLowerCase() === rel.toLowerCase() ||
            cs.aliases.some((a) => a.toLowerCase() === rel.toLowerCase()),
        );
        if (match && !relatedNames.includes(match.canonicalName)) {
          relatedNames.push(match.canonicalName);
        }
      }
    }

    // 2. High-affinity technological pairings
    const pairings: Record<string, string[]> = {
      kubernetes: ["docker", "container", "linux", "cloud", "aws", "gcp"],
      docker: ["linux", "ci/cd", "kubernetes", "backend"],
      next: ["react", "typescript", "javascript", "frontend"],
      react: ["javascript", "typescript", "html", "css", "next.js"],
      typescript: ["javascript", "react", "node.js"],
      graphql: ["typescript", "node.js", "rest", "api", "react"],
      postgresql: ["sql", "database", "node.js", "python", "backend"],
      mongodb: ["nosql", "node.js", "database", "backend"],
      redis: ["cache", "backend", "postgresql", "node.js"],
      aws: ["cloud", "docker", "devops", "linux", "terraform"],
      fastapi: ["python", "backend", "rest", "api"],
      django: ["python", "backend", "sql", "postgresql"],
      express: ["node.js", "javascript", "typescript", "rest"],
    };

    for (const [key, relatedList] of Object.entries(pairings)) {
      if (lowerTarget.includes(key)) {
        for (const rel of relatedList) {
          const found = candidateSkills.find((cs) =>
            cs.canonicalName.toLowerCase().includes(rel),
          );
          if (found && !relatedNames.includes(found.canonicalName)) {
            relatedNames.push(found.canonicalName);
          }
        }
      }
    }

    // 3. Category affinity (e.g. candidate has other demonstrated Frontend or Database skills)
    const sameCategorySkills = candidateSkills.filter(
      (cs) => cs.category === category && cs.canonicalName.toLowerCase() !== lowerTarget,
    );

    let synergyScore = 0;
    if (relatedNames.length >= 2) {
      synergyScore = 15;
    } else if (relatedNames.length === 1) {
      synergyScore = 12;
    } else if (sameCategorySkills.length >= 2) {
      synergyScore = 10;
      relatedNames.push(...sameCategorySkills.slice(0, 2).map((s) => s.canonicalName));
    } else if (sameCategorySkills.length === 1) {
      synergyScore = 6;
      relatedNames.push(sameCategorySkills[0].canonicalName);
    }

    const explanation =
      synergyScore > 0
        ? `High ecosystem synergy (+${synergyScore} pts) with demonstrated competencies in ${relatedNames.join(", ")}.`
        : "No direct ecosystem synergy with candidate's existing demonstrated skills (+0 pts).";

    return {
      score: synergyScore,
      related: relatedNames,
      explanation,
    };
  }

  /**
   * Deterministic Transparent Priority Engine.
   *
   * Formula:
   * Priority Score = Requirement Urgency (40 pts)
   *                + Proficiency Deficit (30 pts)
   *                + Evidence Deficit (15 pts)
   *                + Ecosystem Synergy (15 pts)
   * Total: 0 to 100
   *
   * Thresholds:
   * Critical: >= 80
   * High: 60 - 79
   * Medium: 40 - 59
   * Low: < 40
   */
  private calculatePriority(
    canonicalName: string,
    category: SkillCategory,
    status: GapCategory,
    importance: JobImportance,
    targetProficiency: SkillProficiency,
    candidateProficiency: SkillProficiency | "Not Detected",
    candidateSkill: SkillMatrixItem | undefined,
    allCandidateSkills: SkillMatrixItem[],
  ): {
    priority: GapPriorityLevel;
    priorityScore: number;
    priorityRationale: string;
    priorityFactors: PriorityFactorBreakdown;
    relatedCandidateSkills: string[];
  } {
    // If status is MATCH, candidate fully meets requirement
    if (status === "MATCH") {
      const requirementWeight = importance === "Required" ? 25 : 10;
      const priorityFactors: PriorityFactorBreakdown = {
        requirementWeight,
        proficiencyDeficit: 0,
        evidenceDeficit: 0,
        ecosystemSynergy: 0,
        totalScore: requirementWeight,
        explanation: `Requirement fully met with verified candidate evidence (${importance}).`,
      };
      return {
        priority: "Low",
        priorityScore: requirementWeight,
        priorityRationale: `[Score: ${requirementWeight}/100 • Low Priority] Competency fully verified against ${importance} requirement. No remediation required.`,
        priorityFactors,
        relatedCandidateSkills: [],
      };
    }

    // 1. Requirement Urgency (40 pts max)
    const requirementWeight = importance === "Required" ? 40 : 15;

    // 2. Proficiency Deficit (30 pts max)
    const targetRank = this.proficiencyToRank(targetProficiency);
    const candidateRank = this.proficiencyToRank(candidateProficiency);
    let proficiencyDeficit = 0;
    let profDeficitExplanation = "";

    if (candidateRank === 0) {
      proficiencyDeficit = 30;
      profDeficitExplanation = `Zero demonstrated proficiency in ${canonicalName} (+30 pts)`;
    } else {
      const delta = targetRank - candidateRank;
      if (delta >= 2) {
        proficiencyDeficit = 25;
        profDeficitExplanation = `Major proficiency gap (${candidateProficiency} vs required ${targetProficiency}, +25 pts)`;
      } else if (delta === 1) {
        proficiencyDeficit = 15;
        profDeficitExplanation = `Moderate proficiency gap (${candidateProficiency} vs required ${targetProficiency}, +15 pts)`;
      } else {
        proficiencyDeficit = 5;
        profDeficitExplanation = `Slight proficiency gap (+5 pts)`;
      }
    }

    // 3. Evidence Deficit (15 pts max)
    const evidenceCount = candidateSkill ? candidateSkill.evidence.length : 0;
    let evidenceDeficit = 0;
    let evidenceExplanation = "";

    if (evidenceCount === 0) {
      evidenceDeficit = 15;
      evidenceExplanation = "Zero verifiable evidence or project artifacts (+15 pts)";
    } else if (
      candidateSkill?.evidenceLevel === "WeakEvidence" ||
      candidateSkill?.evidenceLevel === "ClaimedOnly" ||
      (candidateSkill?.confidence ?? 0) < 45 ||
      evidenceCount === 1
    ) {
      evidenceDeficit = 10;
      evidenceExplanation = `Single weak or uncorroborated evidence mention (+10 pts)`;
    } else {
      evidenceDeficit = 0;
      evidenceExplanation = `Multiple verified evidence sources (+0 pts)`;
    }

    // 4. Ecosystem Synergy (15 pts max)
    const synergy = this.findEcosystemSynergies(canonicalName, category, allCandidateSkills);
    const ecosystemSynergy = synergy.score;

    // Calculate Total Score (0 to 100)
    const rawScore = requirementWeight + proficiencyDeficit + evidenceDeficit + ecosystemSynergy;
    const totalScore = Math.min(100, Math.max(0, rawScore));

    // Determine Priority Level Tier
    let priority: GapPriorityLevel;
    if (totalScore >= 80) {
      priority = "Critical";
    } else if (totalScore >= 60) {
      priority = "High";
    } else if (totalScore >= 40) {
      priority = "Medium";
    } else {
      priority = "Low";
    }

    const priorityRationale = `[Score: ${totalScore}/100 • ${priority} Priority] ${
      importance === "Required" ? "Mandatory role requirement (+40 pts)" : "Preferred role qualification (+15 pts)"
    }, ${profDeficitExplanation}, ${evidenceExplanation}. ${synergy.explanation}`;

    const priorityFactors: PriorityFactorBreakdown = {
      requirementWeight,
      proficiencyDeficit,
      evidenceDeficit,
      ecosystemSynergy,
      totalScore,
      explanation: priorityRationale,
    };

    return {
      priority,
      priorityScore: totalScore,
      priorityRationale,
      priorityFactors,
      relatedCandidateSkills: synergy.related,
    };
  }

  /**
   * Transparent Scoring Model Metadata.
   */
  private getScoringModelExplanation(): ScoringModelExplanation {
    return {
      modelName: "SkillTwin Deterministic 4-Factor Priority Model",
      formula:
        "Priority Score = Requirement Urgency (40%) + Proficiency Deficit (30%) + Evidence Deficit (15%) + Ecosystem Synergy (15%)",
      factors: [
        {
          factor: "Requirement Urgency",
          weight: "40 pts max",
          description:
            "Required role qualifications receive 40 pts; preferred/nice-to-have qualifications receive 15 pts.",
        },
        {
          factor: "Proficiency Deficit",
          weight: "30 pts max",
          description:
            "Measures proficiency delta: Not Detected (30 pts), 2+ level gap (25 pts), 1 level gap (15 pts), meets/exceeds (0 pts).",
        },
        {
          factor: "Evidence Deficit",
          weight: "15 pts max",
          description:
            "0 evidence sources (15 pts), single weak/claimed keyword mention (10 pts), verified multi-source history (0 pts).",
        },
        {
          factor: "Ecosystem Synergy",
          weight: "15 pts max",
          description:
            "Synergy bonus awarded when candidate already demonstrates adjacent skills in the same tech stack, yielding maximum learning ROI.",
        },
      ],
      priorityThresholds: {
        critical: "Priority Score >= 80 (Immediate hiring blocker, mandatory requirement)",
        high: "Priority Score 60 - 79 (Substantial gap with strong learning synergy)",
        medium: "Priority Score 40 - 59 (Moderate gap or preferred qualification)",
        low: "Priority Score < 40 (Secondary optional item or fully matched)",
      },
    };
  }

  /**
   * Perform deterministic comparison between a candidate's SkillMatrix
   * and a target JobExtraction requirements matrix.
   */
  compare(
    matrix: SkillMatrix,
    job: JobExtraction,
    _options?: CompareEngineOptions,
  ): GapAnalysisReport {
    // 1. Build canonical index of candidate skills
    const candidateMap = new Map<string, SkillMatrixItem>();

    for (const item of matrix.items) {
      // Map by item's canonical name (lowercased)
      candidateMap.set(item.canonicalName.toLowerCase(), item);

      // Also map all aliases in registry for this skill to point to this item
      const def = this.registry.getSkill(item.canonicalName);
      if (def) {
        for (const alias of def.aliases) {
          candidateMap.set(alias.toLowerCase(), item);
        }
      }
    }

    // 2. Collect all requirements from JD (deduplicating by canonical name)
    const processedSkills = new Set<string>();
    const comparisonItems: ComparisonItem[] = [];

    // Helper to evaluate a job requirement against candidate skill map
    const evaluateRequirement = (req: JobSkillRequirement, importance: JobImportance) => {
      // Normalize requirement name to canonical name
      const normMatch = this.normalizer.normalizeSkill(req.canonicalName);
      const canonicalName = normMatch ? normMatch.canonicalName : req.canonicalName;
      const lowerCanonical = canonicalName.toLowerCase();

      if (processedSkills.has(lowerCanonical)) return;
      processedSkills.add(lowerCanonical);

      // Find candidate skill
      let candidateSkill = candidateMap.get(lowerCanonical);

      // If not directly found, check raw requirement name
      if (!candidateSkill) {
        candidateSkill = candidateMap.get(req.canonicalName.toLowerCase());
      }

      const targetRank = this.proficiencyToRank(req.minimumProficiency);
      const candidateRank = candidateSkill ? this.proficiencyToRank(candidateSkill.proficiency) : 0;
      const candidateProficiency: SkillProficiency | "Not Detected" = candidateSkill
        ? candidateSkill.proficiency
        : "Not Detected";
      const candidateConfidence = candidateSkill ? candidateSkill.confidence : 0;
      const evidenceCount = candidateSkill ? candidateSkill.evidence.length : 0;
      const category: SkillCategory = candidateSkill ? candidateSkill.category : req.category;

      // Classify status based on Phase 5 deterministic rules:
      let status: GapCategory;

      if (!candidateSkill || evidenceCount === 0 || candidateConfidence === 0) {
        // Missing skill entirely
        if (importance === "Required") {
          status = "GAP"; // Critical Gap
        } else {
          status = "OPTIONAL_GAP";
        }
      } else {
        // Candidate has evidence for this skill!
        // Rule: "Do not claim a skill is missing if credible evidence exists."
        // Rule: "Do not assume proficiency simply because a technology appears once."

        const isOnlyClaimedOrWeak =
          candidateSkill.evidenceLevel === "ClaimedOnly" ||
          candidateSkill.evidenceLevel === "WeakEvidence" ||
          candidateSkill.confidence < 40 ||
          (!candidateSkill.demonstrated && evidenceCount <= 1) ||
          candidateSkill.evidence.every((e) => e.sourceType === "skills_section" || e.sourceType === "education");

        if (isOnlyClaimedOrWeak && targetRank >= 2) {
          // Technology appears only once with weak evidence
          status = importance === "Required" ? "WEAK_EVIDENCE" : "OPTIONAL_GAP";
        } else if (candidateRank >= targetRank && candidateConfidence >= 55) {
          // Fully meets or exceeds target requirement with credible confidence
          status = "MATCH";
        } else if (candidateRank > 0) {
          // Partially meets the requirement (demonstrated knowledge, but lower proficiency or moderate confidence)
          status = importance === "Required" ? "PARTIAL" : "OPTIONAL_GAP";
        } else {
          status = importance === "Required" ? "GAP" : "OPTIONAL_GAP";
        }
      }

      // Generate Evidence Summary
      const evidenceSummary = this.generateEvidenceSummary(candidateSkill);

      // Generate Gap Rationale
      const gapRationale = this.generateGapRationale(
        canonicalName,
        importance,
        status,
        req.minimumProficiency,
        candidateProficiency,
        req.contextSentence,
        evidenceCount,
        candidateConfidence,
      );

      // Generate Actionable Developer Next Step
      const suggestedAction = this.generateSuggestedAction(
        canonicalName,
        category,
        status,
        req.minimumProficiency,
      );

      // Calculate Priority via Deterministic Priority Engine
      const priorityData = this.calculatePriority(
        canonicalName,
        category,
        status,
        importance,
        req.minimumProficiency,
        candidateProficiency,
        candidateSkill,
        matrix.items,
      );

      comparisonItems.push({
        canonicalName,
        category,
        status,
        importance,
        candidateProficiency,
        requiredProficiency: req.minimumProficiency,
        candidateConfidence,
        evidenceCount,
        evidenceSummary,
        gapRationale,
        suggestedAction,
        priority: priorityData.priority,
        priorityScore: priorityData.priorityScore,
        priorityRationale: priorityData.priorityRationale,
        priorityFactors: priorityData.priorityFactors,
        relatedCandidateSkills: priorityData.relatedCandidateSkills,
      });
    };

    // Evaluate Required skills first (priority rule)
    for (const req of job.requiredSkills) {
      evaluateRequirement(req, "Required");
    }

    // Evaluate Preferred skills
    for (const pref of job.preferredSkills) {
      evaluateRequirement(pref, "Preferred");
    }

    // Sort items by priorityScore descending (Highest Priority Gaps First!)
    const sortByPriority = (items: ComparisonItem[]) =>
      [...items].sort((a, b) => b.priorityScore - a.priorityScore);

    // Partition items into standard report buckets, sorted highest priority first
    const criticalGaps = sortByPriority(
      comparisonItems.filter((i) => i.status === "GAP" && i.importance === "Required"),
    );
    const partialGaps = sortByPriority(
      comparisonItems.filter((i) => i.status === "PARTIAL" && i.importance === "Required"),
    );
    const weakEvidence = sortByPriority(
      comparisonItems.filter((i) => i.status === "WEAK_EVIDENCE"),
    );
    const strongMatches = sortByPriority(
      comparisonItems.filter((i) => i.status === "MATCH"),
    );
    const optionalGaps = sortByPriority(
      comparisonItems.filter(
        (i) => i.status === "OPTIONAL_GAP" || (i.importance === "Preferred" && i.status !== "MATCH"),
      ),
    );

    // Compute deterministic alignment score
    const requiredItems = comparisonItems.filter((i) => i.importance === "Required");
    const preferredItems = comparisonItems.filter((i) => i.importance === "Preferred");

    const getPoints = (status: GapCategory) => {
      switch (status) {
        case "MATCH":
          return 1.0;
        case "PARTIAL":
          return 0.55;
        case "WEAK_EVIDENCE":
          return 0.35;
        case "GAP":
        case "OPTIONAL_GAP":
        default:
          return 0.0;
      }
    };

    let alignmentScore = 0;
    if (requiredItems.length > 0) {
      const reqScore =
        (requiredItems.reduce((acc, item) => acc + getPoints(item.status), 0) /
          requiredItems.length) *
        100;
      if (preferredItems.length > 0) {
        const prefScore =
          (preferredItems.reduce((acc, item) => acc + getPoints(item.status), 0) /
            preferredItems.length) *
          100;
        alignmentScore = Math.round(reqScore * 0.8 + prefScore * 0.2);
      } else {
        alignmentScore = Math.round(reqScore);
      }
    } else if (comparisonItems.length > 0) {
      alignmentScore = Math.round(
        (comparisonItems.reduce((acc, item) => acc + getPoints(item.status), 0) /
          comparisonItems.length) *
          100,
      );
    } else {
      alignmentScore = 100;
    }

    // Cap between 0 and 100
    alignmentScore = Math.max(0, Math.min(100, alignmentScore));

    let alignmentRating: "Strong" | "Moderate" | "Developing" | "Low" = "Low";
    if (alignmentScore >= 80) alignmentRating = "Strong";
    else if (alignmentScore >= 60) alignmentRating = "Moderate";
    else if (alignmentScore >= 40) alignmentRating = "Developing";
    else alignmentRating = "Low";

    // Generate human-readable alignment explanation
    const matchCount = strongMatches.length;
    const criticalCount = criticalGaps.length;
    const partialCount = partialGaps.length;
    const weakCount = weakEvidence.length;
    const optionalCount = optionalGaps.length;

    let alignmentExplanation = `Candidate demonstrates a ${alignmentRating.toLowerCase()} alignment score of ${alignmentScore}% for ${job.title}${job.company ? ` at ${job.company}` : ""}. `;
    alignmentExplanation += `You have ${matchCount} confirmed strong matches across core competencies. `;
    if (criticalCount > 0) {
      alignmentExplanation += `There are ${criticalCount} critical required gaps (${criticalGaps
        .slice(0, 3)
        .map((g) => g.canonicalName)
        .join(", ")}) that lack verified evidence. `;
    }
    if (partialCount > 0 || weakCount > 0) {
      alignmentExplanation += `${partialCount + weakCount} technologies have partial or weak evidence where depth must be substantiated. `;
    }
    if (criticalCount === 0 && alignmentScore >= 80) {
      alignmentExplanation += `Your skill profile strongly aligns with the mandatory requirements of this role.`;
    }

    return {
      id: `gap-${randomUUID()}`,
      resumeId: matrix.resumeId,
      jobId: job.id,
      targetRole: job.title,
      company: job.company,
      summary: {
        totalRequired: requiredItems.length,
        totalPreferred: preferredItems.length,
        matchCount,
        partialCount,
        criticalGapCount: criticalCount,
        weakEvidenceCount: weakCount,
        optionalGapCount: optionalCount,
        alignmentRating,
        alignmentScore,
        alignmentExplanation,
        scoringModel: this.getScoringModelExplanation(),
      },
      criticalGaps,
      partialGaps,
      weakEvidence,
      strongMatches,
      optionalGaps,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateEvidenceSummary(candidateSkill?: SkillMatrixItem): string {
    if (!candidateSkill || candidateSkill.evidence.length === 0) {
      return "No corroborating evidence, production usage, or mentions detected in candidate resume or project history.";
    }

    const snippets = candidateSkill.evidence
      .slice(0, 2)
      .map((e) => `[${e.sourceType.replace("_", " ")}] "${e.context}"`)
      .join(" • ");

    return `${candidateSkill.proficiency} proficiency (${candidateSkill.confidence}% confidence, ${candidateSkill.evidence.length} evidence sources). ${snippets}`;
  }

  private generateGapRationale(
    canonicalName: string,
    importance: JobImportance,
    status: GapCategory,
    reqProf: SkillProficiency,
    candProf: string,
    context?: string,
    evidenceCount: number = 0,
    confidence: number = 0,
  ): string {
    const contextNote = context ? ` Specifically requested: "${context}"` : "";

    switch (status) {
      case "MATCH":
        return `Confirmed ${candProf} proficiency supported by ${evidenceCount} evidence source(s) (${confidence}% confidence), satisfying the target ${reqProf} requirement.${contextNote}`;

      case "PARTIAL":
        return `Candidate possesses demonstrated ${candProf} competency, but the role requires ${reqProf} proficiency with deeper production scope.${contextNote}`;

      case "WEAK_EVIDENCE":
        return `Mentioned in candidate profile, but only as a single keyword without verifiable project deliverables, implementation depth, or measurable metrics. Insufficient to satisfy ${reqProf} standard.${contextNote}`;

      case "GAP":
        return `Explicitly mandatory competency required at ${reqProf} level, but zero verifiable evidence or projects were detected in your profile.${contextNote}`;

      case "OPTIONAL_GAP":
        if (evidenceCount > 0) {
          return `Secondary/preferred skill with ${candProf} proficiency. Not a strict hiring blocker, but further depth enhances standing.${contextNote}`;
        }
        return `Secondary/preferred qualification for this position. Absence does not disqualify candidate but represents an optional enhancement opportunity.${contextNote}`;

      default:
        return `Assessed as ${status} relative to role criteria.`;
    }
  }

  private generateSuggestedAction(
    canonicalName: string,
    category: SkillCategory,
    status: GapCategory,
    reqProf: SkillProficiency,
  ): string {
    if (status === "MATCH") {
      return `Highlight your strongest ${canonicalName} contributions and architectural impact during interviews.`;
    }

    if (status === "WEAK_EVIDENCE") {
      return `Expand project bullet points to describe how you specifically implemented ${canonicalName}, citing libraries, scale, or performance outcomes.`;
    }

    // Technology-specific actionable recommendations
    const lower = canonicalName.toLowerCase();

    if (lower.includes("docker") || lower.includes("container")) {
      return "Build a containerized multi-service project using Docker and Docker Compose with health checks and publish Dockerfiles to GitHub.";
    }
    if (lower.includes("kubernetes") || lower.includes("k8s")) {
      return "Deploy a microservice cluster using local Minikube or Kind, defining Deployments, Services, ConfigMaps, and an Ingress controller.";
    }
    if (lower.includes("react")) {
      return "Build an interactive web application demonstrating React 18 hooks, custom hooks, state management, and optimized re-renders.";
    }
    if (lower.includes("typescript")) {
      return "Migrate a JavaScript project to TypeScript with strict type checking, generics, and utility types with zero 'any' escapes.";
    }
    if (lower.includes("postgresql") || lower.includes("postgres") || lower.includes("sql")) {
      return "Design a relational schema with foreign key constraints, indexes, and write complex JOIN queries with EXPLAIN ANALYZE verification.";
    }
    if (lower.includes("aws") || lower.includes("cloud")) {
      return "Deploy an application to AWS using ECS or Lambda with automated CI/CD deployment pipelines and S3 asset storage.";
    }
    if (lower.includes("graphql")) {
      return "Implement a GraphQL server schema with queries, mutations, resolvers, and dataloader caching.";
    }
    if (lower.includes("testing") || lower.includes("jest") || lower.includes("vitest")) {
      return "Add automated unit and integration tests achieving >80% test coverage using Vitest/Jest and Supertest.";
    }
    if (lower.includes("system design") || lower.includes("architecture")) {
      return "Document an architecture design document covering data flow, caching, database selection, and horizontal scaling strategies.";
    }

    switch (category) {
      case "Frontend":
        return `Build a focused portfolio project featuring ${canonicalName} with responsive design and automated component tests.`;
      case "Backend":
        return `Implement a RESTful or RPC service utilizing ${canonicalName} with structured error handling and database integration.`;
      case "Databases":
        return `Create a data modeling demonstration using ${canonicalName}, showcasing queries, indexing, and migration management.`;
      case "Cloud/DevOps":
        return `Construct an automated infrastructure workflow or deployment configuration highlighting ${canonicalName}.`;
      case "Languages":
        return `Write idiomatic code and solve advanced data structure challenges using ${canonicalName} on GitHub.`;
      default:
        return `Complete a hands-on project incorporating ${canonicalName} to build verified demonstrable evidence for ${reqProf} proficiency.`;
    }
  }
}

export const gapEngine = new GapEngine();
