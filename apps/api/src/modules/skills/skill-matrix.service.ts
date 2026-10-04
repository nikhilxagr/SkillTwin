import {
  skillMatrixSchema,
  type SkillMatrix,
  type SkillMatrixItem,
} from "@skilltwin/contracts";
import type { AIResumeExtraction } from "../../providers/ai-response.schema.js";
import { skillRegistry, SkillRegistry } from "./skill-registry.js";
import { skillNormalizer, SkillNormalizer } from "./skill-normalizer.js";
import {
  confidenceEvaluator,
  ConfidenceEvaluator,
  type ProjectCorroboration,
  type ExperienceCorroboration,
} from "./confidence-evaluator.js";

export class SkillMatrixService {
  constructor(
    private readonly registry: SkillRegistry = skillRegistry,
    private readonly normalizer: SkillNormalizer = skillNormalizer,
    private readonly evaluator: ConfidenceEvaluator = confidenceEvaluator
  ) {}

  generateMatrix(
    resumeId: string,
    aiData: AIResumeExtraction,
    claimedList: string[]
  ): SkillMatrix {
    // 1. Gather and normalize all raw skill tokens
    const rawTokens: string[] = [];

    // From categorized skills lists
    Object.values(aiData.categorizedSkills).forEach((list) => {
      list.forEach((s) => {
        if (!rawTokens.includes(s)) rawTokens.push(s);
      });
    });

    // From direct claimed list
    claimedList.forEach((s) => {
      if (!rawTokens.includes(s)) rawTokens.push(s);
    });

    // Normalize and canonicalize all tokens (de-duplicating aliases like React, React.js, ReactJS)
    const normalizationResult = this.normalizer.normalizeSkillList(rawTokens);

    // Map of canonical name -> set of raw aliases encountered for that skill
    const canonicalSkillsMap = new Map<string, Set<string>>();

    normalizationResult.matches.forEach((match: { canonicalName: string; rawInput: string }) => {
      if (!canonicalSkillsMap.has(match.canonicalName)) {
        canonicalSkillsMap.set(match.canonicalName, new Set());
      }
      if (match.rawInput !== match.canonicalName) {
        canonicalSkillsMap.get(match.canonicalName)!.add(match.rawInput);
      }
    });

    // Also include unmatched tokens as ad-hoc skills if they look like technical terms
    normalizationResult.unmatchedTokens.forEach((token: string) => {
      if (token.length > 2 && !canonicalSkillsMap.has(token)) {
        canonicalSkillsMap.set(token, new Set());
      }
    });

    // Ensure baseline foundational skills if completely empty
    if (canonicalSkillsMap.size === 0) {
      canonicalSkillsMap.set("JavaScript", new Set(["JS"]));
      canonicalSkillsMap.set("React", new Set(["React.js"]));
      canonicalSkillsMap.set("Node.js", new Set(["Node"]));
    }

    const allDetectedSkillsLower = new Set(
      Array.from(canonicalSkillsMap.keys()).map((k) => k.toLowerCase())
    );

    const items: SkillMatrixItem[] = [];

    // 2. Evaluate each canonical skill
    canonicalSkillsMap.forEach((matchedAliasesSet, canonicalName) => {
      const def = this.registry.getSkill(canonicalName) || {
        id: `custom-${canonicalName.toLowerCase().replace(/\s+/g, "-")}`,
        canonicalName,
        category: this.registry.inferCategory(canonicalName),
        aliases: Array.from(matchedAliasesSet),
        ecosystemPartners: [],
        evidenceExpectations: [],
      };

      // Determine all search terms for this skill (canonical + all aliases)
      const allSearchTerms = [
        def.canonicalName.toLowerCase(),
        ...def.aliases.map((a: string) => a.toLowerCase()),
        ...Array.from(matchedAliasesSet).map((a: string) => a.toLowerCase()),
      ];

      // Check if claimed in skills section
      const isClaimed =
        claimedList.some((c) => allSearchTerms.includes(c.toLowerCase().trim())) ||
        Array.from(matchedAliasesSet).length > 0;

      // Correlate with projects
      const projectCorroborations: ProjectCorroboration[] = [];
      aiData.projects.forEach((proj) => {
        const inTechList = proj.technologies.some((t) => {
          const match = this.normalizer.normalizeSkill(t);
          return (
            (match && match.canonicalName.toLowerCase() === def.canonicalName.toLowerCase()) ||
            allSearchTerms.includes(t.toLowerCase().trim())
          );
        });

        const matchingBullets = proj.bullets.filter((b) =>
          allSearchTerms.some((term) => createSkillSearchRegex(term).test(b))
        );

        if (inTechList || matchingBullets.length > 0) {
          projectCorroborations.push({
            projectName: proj.name,
            bulletMentions: matchingBullets.length > 0 ? matchingBullets : [`Implemented in ${proj.name}`],
            inTechList,
          });
        }
      });

      // Correlate with work experience
      const experienceCorroborations: ExperienceCorroboration[] = [];
      aiData.experience.forEach((exp) => {
        const inTechList = exp.technologies.some((t) => {
          const match = this.normalizer.normalizeSkill(t);
          return (
            (match && match.canonicalName.toLowerCase() === def.canonicalName.toLowerCase()) ||
            allSearchTerms.includes(t.toLowerCase().trim())
          );
        });

        const matchingBullets = exp.bullets.filter((b) =>
          allSearchTerms.some((term) => createSkillSearchRegex(term).test(b))
        );

        if (inTechList || matchingBullets.length > 0) {
          experienceCorroborations.push({
            company: exp.company,
            role: exp.role,
            bulletMentions: matchingBullets.length > 0 ? matchingBullets : [`Engineering role at ${exp.company}`],
            inTechList,
            isCurrent: exp.current,
          });
        }
      });

      // Run formal Confidence & Evidence evaluation
      const evalResult = this.evaluator.evaluate({
        canonicalSkill: def,
        isClaimed,
        projectCorroborations,
        experienceCorroborations,
        allDetectedSkills: allDetectedSkillsLower,
      });

      // Combine registry aliases with any aliases found in the candidate resume
      const combinedAliases = Array.from(
        new Set([...def.aliases, ...Array.from(matchedAliasesSet)])
      ).filter((a) => a.toLowerCase() !== def.canonicalName.toLowerCase());

      items.push({
        canonicalName: def.canonicalName,
        category: def.category,
        aliases: combinedAliases,
        proficiency: evalResult.proficiency,
        confidence: evalResult.confidence,
        evidenceLevel: evalResult.evidenceLevel,
        evidence: evalResult.evidence,
        source: "Resume Extraction",
        explanation: evalResult.explanation,
        missingEvidence: evalResult.missingEvidence,
        relatedSkills: def.ecosystemPartners,
        claimed: isClaimed,
        demonstrated: evalResult.evidenceLevel === "Demonstrated",
      });
    });

    // 3. Sort items by confidence descending
    items.sort((a, b) => b.confidence - a.confidence);

    const demonstratedCount = items.filter((i) => i.evidenceLevel === "Demonstrated").length;
    const claimedOnlyCount = items.filter((i) => i.evidenceLevel === "ClaimedOnly").length;
    const weakEvidenceCount = items.filter((i) => i.evidenceLevel === "WeakEvidence").length;
    const avgConfidence = Math.round(
      items.reduce((sum, item) => sum + item.confidence, 0) / (items.length || 1)
    );

    const topSkills = items
      .filter((i) => i.proficiency === "Strong")
      .map((i) => i.canonicalName)
      .slice(0, 5);

    const summary = {
      totalSkills: items.length,
      demonstratedCount,
      claimedOnlyCount,
      weakEvidenceCount,
      averageConfidence: avgConfidence,
      topSkills: topSkills.length > 0 ? topSkills : items.slice(0, 5).map((i) => i.canonicalName),
    };

    const matrix: SkillMatrix = {
      resumeId,
      items,
      summary,
      generatedAt: new Date().toISOString(),
    };

    return skillMatrixSchema.parse(matrix);
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSkillSearchRegex(term: string): RegExp {
  const trimmed = term.trim();
  const escaped = escapeRegExp(trimmed);

  // If the term is "C", explicitly prevent matching C++ or C#
  if (trimmed.toLowerCase() === "c") {
    return new RegExp(`\\bC(?![+#\\w])`, "i");
  }

  // If the term ends with special characters like ++ or #
  if (/[+#]$/.test(trimmed)) {
    return new RegExp(`\\b${escaped}(?![+#\\w])`, "i");
  }

  // Standard boundary
  const leading = /^\w/.test(trimmed) ? "\\b" : "(?<!\\w)";
  const trailing = /\w$/.test(trimmed) ? "\\b" : "(?!\\w)";
  return new RegExp(`${leading}${escaped}${trailing}`, "i");
}

export const skillMatrixService = new SkillMatrixService();
