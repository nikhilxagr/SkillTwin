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
} from "@skilltwin/contracts";
import { skillNormalizer, SkillNormalizer } from "../skills/skill-normalizer.js";
import { skillRegistry, SkillRegistry } from "../skills/skill-registry.js";

export class GapEngine {
  constructor(
    private readonly normalizer: SkillNormalizer = skillNormalizer,
    private readonly registry: SkillRegistry = skillRegistry,
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
   * Perform deterministic comparison between a candidate's SkillMatrix
   * and a target JobExtraction requirements matrix.
   */
  compare(matrix: SkillMatrix, job: JobExtraction): GapAnalysisReport {
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
      const suggestedAction = this.generateSuggestedAction(canonicalName, category, status, req.minimumProficiency);

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

    // Partition items into standard report buckets
    const criticalGaps = comparisonItems.filter((i) => i.status === "GAP" && i.importance === "Required");
    const partialGaps = comparisonItems.filter((i) => i.status === "PARTIAL" && i.importance === "Required");
    const weakEvidence = comparisonItems.filter((i) => i.status === "WEAK_EVIDENCE");
    const strongMatches = comparisonItems.filter((i) => i.status === "MATCH");
    const optionalGaps = comparisonItems.filter(
      (i) => i.status === "OPTIONAL_GAP" || (i.importance === "Preferred" && i.status !== "MATCH"),
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
      const reqScore = (requiredItems.reduce((acc, item) => acc + getPoints(item.status), 0) / requiredItems.length) * 100;
      if (preferredItems.length > 0) {
        const prefScore =
          (preferredItems.reduce((acc, item) => acc + getPoints(item.status), 0) / preferredItems.length) * 100;
        alignmentScore = Math.round(reqScore * 0.8 + prefScore * 0.2);
      } else {
        alignmentScore = Math.round(reqScore);
      }
    } else if (comparisonItems.length > 0) {
      alignmentScore = Math.round(
        (comparisonItems.reduce((acc, item) => acc + getPoints(item.status), 0) / comparisonItems.length) * 100,
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
