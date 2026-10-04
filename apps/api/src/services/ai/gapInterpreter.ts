import { z } from "zod";
import { geminiService, GeminiService } from "./gemini.js";

export const contextualInterpretationResultSchema = z.object({
  substantiated: z.boolean(),
  evidenceDepth: z.enum([
    "DeepProduction",
    "ModerateImplementation",
    "SuperficialMention",
    "None",
  ]),
  confidenceAdjustment: z.number().min(-30).max(30),
  contextualAnalysis: z.string(),
});
export type ContextualInterpretationResult = z.infer<
  typeof contextualInterpretationResultSchema
>;

export interface ContextualInterpretationInput {
  canonicalName: string;
  category: string;
  requirementSentence?: string;
  targetProficiency: string;
  candidateEvidenceTexts: string[];
  candidateProficiency: string;
}

export const GAP_INTERPRETER_SYSTEM_PROMPT = `
You are the Contextual Evidence Interpreter for SkillTwin, an evidence-based developer career intelligence platform.
Your mission is to perform strict, objective contextual interpretation of candidate resume evidence against a specific technical job requirement.

RULES:
1. Ground your interpretation solely in the provided evidence snippets. NEVER hallucinate experience.
2. Determine whether the candidate's evidence reflects:
   - "DeepProduction": Multi-service architecture, performance tuning, scale, production deployment, or deep feature engineering.
   - "ModerateImplementation": Working implementation, component building, standard API integration.
   - "SuperficialMention": Merely listed in a skills section or mentioned casually in passing without project depth.
   - "None": No relevant context detected.
3. Be skeptical of simple keyword stuffing. Evidence matters more than presence.
4. Output must strictly conform to the provided JSON schema.
`.trim();

export class GapInterpreter {
  constructor(private readonly gemini: GeminiService = geminiService) {}

  /**
   * Determine if candidate's evidence text contextually satisfies a specific JD requirement.
   * If Gemini is available, uses AI contextual interpretation.
   * Otherwise, falls back to deterministic heuristic evaluation.
   */
  async interpretEvidence(
    input: ContextualInterpretationInput,
  ): Promise<ContextualInterpretationResult> {
    if (!this.gemini.isConfigured()) {
      return this.deterministicFallback(input);
    }

    try {
      const userPrompt = `
Evaluate the candidate's demonstrated evidence for technical competency: "${input.canonicalName}" (${input.category})
Target Requirement from JD: "${input.requirementSentence || `Proficiency in ${input.canonicalName}`}"
Target Proficiency Required: ${input.targetProficiency}
Candidate Claimed Proficiency: ${input.candidateProficiency}

Candidate's Extracted Evidence Snippets:
${input.candidateEvidenceTexts.map((text, idx) => `${idx + 1}. "${text}"`).join("\n") || "No evidence provided."}

Respond in JSON adhering to this schema:
{
  "substantiated": boolean,
  "evidenceDepth": "DeepProduction" | "ModerateImplementation" | "SuperficialMention" | "None",
  "confidenceAdjustment": number, // integer between -30 and +30
  "contextualAnalysis": string // Concise, objective technical explanation
}
`.trim();

      const result = await this.gemini.generateStructuredContent({
        systemPrompt: GAP_INTERPRETER_SYSTEM_PROMPT,
        userPrompt,
        schema: contextualInterpretationResultSchema,
        temperature: 0.1,
        timeoutMs: 12000,
      });

      return result;
    } catch {
      return this.deterministicFallback(input);
    }
  }

  /**
   * Deterministic semantic heuristic when AI is offline or unavailable.
   */
  private deterministicFallback(
    input: ContextualInterpretationInput,
  ): ContextualInterpretationResult {
    const snippets = input.candidateEvidenceTexts;
    if (snippets.length === 0) {
      return {
        substantiated: false,
        evidenceDepth: "None",
        confidenceAdjustment: 0,
        contextualAnalysis: `No evidence found in candidate profile for ${input.canonicalName}.`,
      };
    }

    const combinedText = snippets.join(" ").toLowerCase();
    const deepTerms = [
      "architect",
      "scale",
      "scaled",
      "performance",
      "latency",
      "throughput",
      "production",
      "pipeline",
      "cluster",
      "database",
      "optimized",
      "redesigned",
      "security",
      "distributed",
    ];

    const moderateTerms = [
      "built",
      "implemented",
      "created",
      "developed",
      "integrated",
      "wrote",
      "designed",
      "configured",
      "migrated",
    ];

    const hasDeepTerm = deepTerms.some((t) => combinedText.includes(t));
    const hasModTerm = moderateTerms.some((t) => combinedText.includes(t));

    if (hasDeepTerm && snippets.length >= 2) {
      return {
        substantiated: true,
        evidenceDepth: "DeepProduction",
        confidenceAdjustment: 10,
        contextualAnalysis: `Candidate provides ${snippets.length} evidence sources showing production deliverables and architectural scope.`,
      };
    }

    if (hasModTerm || snippets.length >= 1) {
      return {
        substantiated: true,
        evidenceDepth: "ModerateImplementation",
        confidenceAdjustment: 0,
        contextualAnalysis: `Candidate provides demonstrated evidence of implementing ${input.canonicalName}.`,
      };
    }

    return {
      substantiated: false,
      evidenceDepth: "SuperficialMention",
      confidenceAdjustment: -15,
      contextualAnalysis: `Only superficial or keyword mentions found without verifiable implementation deliverables.`,
    };
  }
}

export const gapInterpreter = new GapInterpreter();
