/**
 * Sanitizes and normalizes raw text extracted from documents (PDF, DOCX, TXT)
 */
export function normalizeDocumentText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  return rawText
    // Replace non-standard bullets and quotes
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF]/g, "\n• ")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    // Normalize newlines
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove control characters except tab and newline
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse horizontal whitespace (spaces, tabs)
    .replace(/[ \t]+/g, " ")
    // Collapse excessive consecutive blank lines to double newlines
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}
