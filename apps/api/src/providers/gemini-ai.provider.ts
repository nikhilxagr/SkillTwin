import type { IAIProvider } from "./ai-provider.interface.js";
import { aiResumeExtractionSchema, type AIResumeExtraction } from "./ai-response.schema.js";
import { RESUME_EXTRACTION_SYSTEM_PROMPT, createResumeExtractionPrompt } from "./prompts/resume-extraction.prompt.js";
import { JOB_EXTRACTION_SYSTEM_PROMPT } from "../modules/job/job-extraction.prompt.js";
import { aiJobExtractionSchema, type AIJobExtraction } from "../modules/job/job.schema.js";
import { deterministicAIProvider } from "./deterministic-ai.provider.js";

export class GeminiAIProvider implements IAIProvider {
  readonly name = "gemini-api";

  constructor(private readonly apiKey: string) {}

  async extractResume(normalizedText: string): Promise<AIResumeExtraction> {
    if (!this.apiKey) {
      return deterministicAIProvider.extractResume(normalizedText);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const userPrompt = createResumeExtractionPrompt(normalizedText);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: RESUME_EXTRACTION_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[GeminiAIProvider] API request failed (${response.status}): ${errorText}. Falling back to deterministic engine.`);
        return deterministicAIProvider.extractResume(normalizedText);
      }

      const responseJson = await response.json();
      const rawTextOutput = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawTextOutput) {
        return deterministicAIProvider.extractResume(normalizedText);
      }

      const parsedJson = JSON.parse(rawTextOutput);
      return aiResumeExtractionSchema.parse(parsedJson);
    } catch (err: any) {
      console.warn(`[GeminiAIProvider] Extraction error: ${err.message}. Falling back to deterministic engine.`);
      return deterministicAIProvider.extractResume(normalizedText);
    }
  }

  async extractJob(normalizedText: string, fallbackTitle?: string, fallbackCompany?: string): Promise<AIJobExtraction> {
    if (!this.apiKey) {
      return deterministicAIProvider.extractJob(normalizedText, fallbackTitle, fallbackCompany);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const userPrompt = `Job Title Hint: ${fallbackTitle || "Not specified"}\nCompany Hint: ${fallbackCompany || "Not specified"}\n\nJob Description Text:\n${normalizedText}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: JOB_EXTRACTION_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        return deterministicAIProvider.extractJob(normalizedText, fallbackTitle, fallbackCompany);
      }

      const responseJson = await response.json();
      const rawTextOutput = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawTextOutput) {
        return deterministicAIProvider.extractJob(normalizedText, fallbackTitle, fallbackCompany);
      }

      const parsedJson = JSON.parse(rawTextOutput);
      return aiJobExtractionSchema.parse(parsedJson);
    } catch (err: any) {
      return deterministicAIProvider.extractJob(normalizedText, fallbackTitle, fallbackCompany);
    }
  }
}
