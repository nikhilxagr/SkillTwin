import { config } from "../../config.js";
import { z } from "zod";

export interface GeminiGenerateOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T, any, any>;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

export class GeminiService {
  private readonly defaultModel = "gemini-2.5-flash";

  /**
   * Returns whether a valid Gemini API key is configured in the backend environment.
   */
  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  /**
   * Retrieves the API key strictly from the server environment.
   */
  private getApiKey(): string {
    return process.env.GEMINI_API_KEY || config.GEMINI_API_KEY || "";
  }

  /**
   * Executes a structured content generation call against the Gemini API
   * with strict Zod validation against the returned JSON.
   */
  async generateStructuredContent<T>(options: GeminiGenerateOptions<T>): Promise<T> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.1;
    const timeoutMs = options.timeoutMs ?? 30000;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: options.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: options.userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API request failed with HTTP ${response.status}: ${errorText}`
        );
      }

      const responseJson: any = await response.json();
      const rawText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Gemini API returned an empty or malformed candidate part.");
      }

      // Parse JSON from model
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr: any) {
        throw new Error(`Failed to parse Gemini output as JSON: ${parseErr.message}\nRaw Output: ${rawText.slice(0, 300)}`);
      }

      // Strictly validate with Zod schema
      return options.schema.parse(parsedJson);
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`Gemini API request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}

export const geminiService = new GeminiService();
