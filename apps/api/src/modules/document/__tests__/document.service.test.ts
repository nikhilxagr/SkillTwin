import { describe, expect, it } from "vitest";
import { documentService, DocumentProcessingError } from "../document.service.js";

const MINIMAL_PDF_BUFFER = Buffer.from(
  "%PDF-1.4\n" +
  "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
  "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
  "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n" +
  "4 0 obj\n<< /Length 75 >>\nstream\n" +
  "BT /F1 12 Tf 100 700 Td (Alex Chen Senior Full-Stack Engineer TypeScript React Node.js PostgreSQL) Tj ET\n" +
  "endstream\nendobj\n" +
  "xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000281 00000 n \n" +
  "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n406\n%%EOF"
);

describe("DocumentService (Modular Parser)", () => {
  it("successfully parses valid PDF document text", async () => {
    const result = await documentService.processFile("resume.pdf", MINIMAL_PDF_BUFFER, "application/pdf");
    expect(result.fileType).toBe("pdf");
    expect(result.fileName).toBe("resume.pdf");
    expect(result.normalizedText).toContain("Alex Chen");
    expect(result.normalizedText).toContain("TypeScript");
  });

  it("handles TXT document buffers", async () => {
    const txt = "Senior Full-Stack Developer with deep experience in TypeScript, React, Next.js, and Postgres database systems.";
    const result = await documentService.processFile("resume.txt", Buffer.from(txt), "text/plain");
    expect(result.fileType).toBe("txt");
    expect(result.normalizedText).toContain("Senior Full-Stack Developer");
  });

  it("rejects empty buffer with EMPTY_FILE code", async () => {
    await expect(documentService.processFile("empty.pdf", Buffer.alloc(0)))
      .rejects.toThrowError(DocumentProcessingError);
  });

  it("rejects file larger than 10MB", async () => {
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(documentService.processFile("huge.pdf", hugeBuffer))
      .rejects.toThrowError("exceeds limit of 10MB");
  });

  it("rejects files with insufficient text (<30 chars)", () => {
    expect(() => documentService.processText("tiny.txt", "short"))
      .toThrowError("too short");
  });

  it("informs user that DOCX modular support is reserved", async () => {
    await expect(documentService.processFile("resume.docx", Buffer.from("dummy docx content"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
      .rejects.toThrowError("DOCX support is coming soon");
  });
});
