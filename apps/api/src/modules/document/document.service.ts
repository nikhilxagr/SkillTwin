import pdfParse from "pdf-parse";
import { normalizeDocumentText } from "./text-normalizer.js";

export interface ExtractedDocument {
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  fileSizeBytes: number;
  rawText: string;
  normalizedText: string;
}

export class DocumentProcessingError extends Error {
  constructor(message: string, public readonly code: string = "DOCUMENT_ERROR") {
    super(message);
    this.name = "DocumentProcessingError";
  }
}

export class DocumentService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validates and extracts normalized text from a document buffer
   */
  async processFile(
    fileName: string,
    buffer: Buffer,
    mimeType?: string
  ): Promise<ExtractedDocument> {
    if (!buffer || buffer.length === 0) {
      throw new DocumentProcessingError("Uploaded file buffer is empty", "EMPTY_FILE");
    }

    if (buffer.length > DocumentService.MAX_FILE_SIZE) {
      throw new DocumentProcessingError(
        `File size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds limit of 10MB`,
        "FILE_TOO_LARGE"
      );
    }

    const lowerName = fileName.toLowerCase();
    let fileType: "pdf" | "docx" | "txt" = "txt";

    if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
      fileType = "pdf";
    } else if (
      lowerName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileType = "docx";
    } else if (lowerName.endsWith(".txt") || mimeType === "text/plain") {
      fileType = "txt";
    } else {
      throw new DocumentProcessingError(
        "Unsupported file format. Please upload a PDF, DOCX, or TXT document.",
        "UNSUPPORTED_TYPE"
      );
    }

    let rawText = "";

    if (fileType === "pdf") {
      try {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text || "";
      } catch (err: any) {
        throw new DocumentProcessingError(
          `Failed to parse PDF document: ${err.message || "Corrupt or encrypted PDF"}`,
          "PDF_PARSE_FAILED"
        );
      }
    } else if (fileType === "txt") {
      rawText = buffer.toString("utf-8");
    } else {
      // Stub for DOCX: currently converts available string content or throws informative error
      throw new DocumentProcessingError(
        "DOCX support is coming soon. Please upload your resume as PDF or plain text.",
        "DOCX_NOT_IMPLEMENTED"
      );
    }

    const normalizedText = normalizeDocumentText(rawText);

    if (normalizedText.length < 30) {
      throw new DocumentProcessingError(
        "Document contains insufficient readable text. If this is a scanned PDF image, please provide a text-based resume.",
        "INSUFFICIENT_TEXT"
      );
    }

    return {
      fileName,
      fileType,
      fileSizeBytes: buffer.length,
      rawText,
      normalizedText,
    };
  }

  /**
   * Processes direct text input
   */
  processText(fileName: string, text: string): ExtractedDocument {
    if (!text || text.trim().length === 0) {
      throw new DocumentProcessingError("Provided text is empty", "EMPTY_TEXT");
    }

    const normalizedText = normalizeDocumentText(text);

    if (normalizedText.length < 30) {
      throw new DocumentProcessingError(
        "Provided text is too short to be a valid technical resume.",
        "INSUFFICIENT_TEXT"
      );
    }

    return {
      fileName: fileName || "Pasted_Resume.txt",
      fileType: "txt",
      fileSizeBytes: Buffer.byteLength(text, "utf-8"),
      rawText: text,
      normalizedText,
    };
  }
}

export const documentService = new DocumentService();
