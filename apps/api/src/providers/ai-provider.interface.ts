import type { AIResumeExtraction } from "./ai-response.schema.js";
import type { AIJobExtraction } from "../modules/job/job.schema.js";

export interface IAIProvider {
  readonly name: string;
  extractResume(normalizedText: string): Promise<AIResumeExtraction>;
  extractJob(normalizedText: string, fallbackTitle?: string, fallbackCompany?: string): Promise<AIJobExtraction>;
}
