import crypto from "node:crypto";
import pdfParse from "pdf-parse";
import type { ResumeUpload } from "@skilltwin/contracts";

const evidencePatterns: Array<{ category: ResumeUpload["evidence"][number]["category"]; expression: RegExp }> = [
  { category: "skill", expression: /\b(react|typescript|javascript|node\.?js|python|docker|mongodb|postgresql|aws)\b/gi },
  { category: "experience", expression: /\b(\d+\+?\s+years?\s+(?:of\s+)?experience)\b/gi },
  { category: "education", expression: /\b(bachelor(?:'s)?|master(?:'s)?|b\.?tech|m\.?tech|computer science)\b/gi },
  { category: "project", expression: /\b(project|built|developed|implemented|deployed)\b/gi },
  { category: "link", expression: /\b(?:https?:\/\/|github\.com|linkedin\.com)\S*/gi },
];

export async function parseResume(fileName: string, buffer: Buffer): Promise<ResumeUpload> {
  const parsed = await pdfParse(buffer);
  const text = parsed.text.replace(/\s+/g, " ").trim();
  const evidence: ResumeUpload["evidence"] = [];
  for (const pattern of evidencePatterns) {
    for (const match of text.matchAll(pattern.expression)) {
      const statement = match[0].trim();
      if (!evidence.some((item) => item.statement.toLowerCase() === statement.toLowerCase())) {
        evidence.push({
          id: `resume-${crypto.randomUUID()}`,
          sourceType: "resume",
          statement,
          category: pattern.category,
          confidence: pattern.category === "skill" ? "moderate" : "low",
        });
      }
    }
  }
  return {
    id: `resume-${crypto.randomUUID()}`,
    fileName,
    status: evidence.length > 0 ? "parsed" : "partial",
    extractedTextLength: text.length,
    evidence,
    limitations: [
      "Extracted statements are claimed evidence until supported by project or repository evidence.",
      "Formatting, tables, images, and portfolio context may not be fully represented in PDF text.",
    ],
  };
}
