import type { IAIProvider } from "./ai-provider.interface.js";
import { GeminiAIProvider } from "./gemini-ai.provider.js";
import { deterministicAIProvider } from "./deterministic-ai.provider.js";

export function getAIProvider(): IAIProvider {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    return new GeminiAIProvider(geminiApiKey.trim());
  }
  return deterministicAIProvider;
}

export const activeAIProvider = getAIProvider();
