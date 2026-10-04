import type {
  NormalizedSkillMatch,
  SkillNormalizationResult,
} from "@skilltwin/contracts";
import { skillRegistry, SkillRegistry } from "./skill-registry.js";

export class SkillNormalizer {
  constructor(private readonly registry: SkillRegistry = skillRegistry) {}

  /**
   * Normalizes a raw input string into a canonical skill match.
   * Recognizes variations like React, React.js, ReactJS, react-js, etc.
   */
  normalizeSkill(rawInput: string): NormalizedSkillMatch | null {
    if (!rawInput || typeof rawInput !== "string") return null;

    const trimmed = rawInput.trim();
    if (trimmed.length === 0) return null;

    // 1. Direct canonical lookup (case-insensitive)
    const exactSkill = this.registry.getSkill(trimmed);
    if (exactSkill) {
      return {
        canonicalName: exactSkill.canonicalName,
        rawInput: trimmed,
        matchedAlias: exactSkill.canonicalName,
        category: exactSkill.category,
        confidence: 100,
        matchType: "exact_canonical",
      };
    }

    // 2. Direct alias lookup
    const canonicalNameFromAlias = this.registry.resolveAlias(trimmed);
    if (canonicalNameFromAlias) {
      const def = this.registry.getSkill(canonicalNameFromAlias);
      if (def) {
        return {
          canonicalName: def.canonicalName,
          rawInput: trimmed,
          matchedAlias: trimmed,
          category: def.category,
          confidence: 95,
          matchType: "alias",
        };
      }
    }

    // 3. Stem & Punctuation Normalization
    // Normalize variations: e.g. "React.js" -> "react", "Vue-JS" -> "vue", "Python 3.11" -> "python"
    const cleaned = trimmed
      .toLowerCase()
      .replace(/[\-_.]/g, " ") // replace dots, dashes, underscores with spaces
      .replace(/\s+/g, " ")
      .trim();

    // Check cleaned form in alias index
    const resolvedCleaned = this.registry.resolveAlias(cleaned);
    if (resolvedCleaned) {
      const def = this.registry.getSkill(resolvedCleaned);
      if (def) {
        return {
          canonicalName: def.canonicalName,
          rawInput: trimmed,
          matchedAlias: cleaned,
          category: def.category,
          confidence: 92,
          matchType: "alias",
        };
      }
    }

    // 4. Strip common technology suffixes (e.g. .js, js, css, sql)
    const strippedSuffix = cleaned
      .replace(/\s*(?:js|javascript|\.js)\b/i, "")
      .replace(/\s*(?:css|stylesheet)\b/i, "")
      .replace(/\s*(?:v?\d+(?:\.\d+)*)\b/i, "") // strip trailing version numbers like "3", "3.10", "17"
      .trim();

    if (strippedSuffix.length > 0 && strippedSuffix !== cleaned) {
      const resolvedSuffix = this.registry.resolveAlias(strippedSuffix);
      if (resolvedSuffix) {
        const def = this.registry.getSkill(resolvedSuffix);
        if (def) {
          return {
            canonicalName: def.canonicalName,
            rawInput: trimmed,
            matchedAlias: strippedSuffix,
            category: def.category,
            confidence: 90,
            matchType: "normalized_stem",
          };
        }
      }
    }

    // 5. Special symbol normalization: e.g. "c plus plus" -> "c++", "c sharp" -> "c#"
    if (/^c\s*(?:plus\s*plus|\+\+)$/i.test(trimmed)) {
      const def = this.registry.getSkill("C++");
      if (def) {
        return {
          canonicalName: def.canonicalName,
          rawInput: trimmed,
          matchedAlias: "C++",
          category: def.category,
          confidence: 95,
          matchType: "normalized_stem",
        };
      }
    }

    if (/^c\s*(?:sharp|\#)$/i.test(trimmed)) {
      const def = this.registry.getSkill("C#");
      if (def) {
        return {
          canonicalName: def.canonicalName,
          rawInput: trimmed,
          matchedAlias: "C#",
          category: def.category,
          confidence: 95,
          matchType: "normalized_stem",
        };
      }
    }

    return null;
  }

  /**
   * Normalizes a list of skill strings into deduplicated canonical matches.
   * If React, React.js, and ReactJS are all in the inputs, they are consolidated
   * into a single canonical React item.
   */
  normalizeSkillList(inputs: string[]): SkillNormalizationResult {
    const canonicalMap = new Map<string, NormalizedSkillMatch>();
    const unmatchedTokens: string[] = [];

    for (const raw of inputs) {
      const match = this.normalizeSkill(raw);
      if (match) {
        const existing = canonicalMap.get(match.canonicalName);
        if (!existing || match.confidence > existing.confidence) {
          canonicalMap.set(match.canonicalName, match);
        }
      } else {
        const cleaned = raw.trim();
        if (cleaned.length > 1 && !unmatchedTokens.includes(cleaned)) {
          unmatchedTokens.push(cleaned);
        }
      }
    }

    return {
      matches: Array.from(canonicalMap.values()),
      unmatchedTokens,
    };
  }

  /**
   * Resolves whether two strings refer to the same canonical skill.
   * Example: areSkillsEquivalent("React", "React.js") === true
   */
  areSkillsEquivalent(skillA: string, skillB: string): boolean {
    const matchA = this.normalizeSkill(skillA);
    const matchB = this.normalizeSkill(skillB);
    if (!matchA || !matchB) return false;
    return matchA.canonicalName.toLowerCase() === matchB.canonicalName.toLowerCase();
  }
}

export const skillNormalizer = new SkillNormalizer();
