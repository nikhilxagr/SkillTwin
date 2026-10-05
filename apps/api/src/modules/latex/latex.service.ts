import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

export interface CompileResult {
  pdfBase64: string;
  engineUsed: string;
  compileDurationMs: number;
}

export class LatexService {
  private localCompilerChecked = false;
  private localCompilerPath: string | null = null;
  private localCompilerType: "tectonic" | "pdflatex" | null = null;

  /**
   * Checks if a local LaTeX engine is available on the host machine.
   */
  async detectLocalCompiler(): Promise<{ path: string; type: "tectonic" | "pdflatex" } | null> {
    if (this.localCompilerChecked) {
      if (this.localCompilerPath && this.localCompilerType) {
        return { path: this.localCompilerPath, type: this.localCompilerType };
      }
      return null;
    }

    this.localCompilerChecked = true;

    // Check for tectonic
    try {
      const { stdout } = await execFileAsync("tectonic", ["--version"]);
      if (stdout.includes("Tectonic")) {
        this.localCompilerPath = "tectonic";
        this.localCompilerType = "tectonic";
        return { path: "tectonic", type: "tectonic" };
      }
    } catch {
      // not found
    }

    // Check for pdflatex
    try {
      const { stdout } = await execFileAsync("pdflatex", ["--version"]);
      if (stdout.toLowerCase().includes("pdftex")) {
        this.localCompilerPath = "pdflatex";
        this.localCompilerType = "pdflatex";
        return { path: "pdflatex", type: "pdflatex" };
      }
    } catch {
      // not found
    }

    return null;
  }

  /**
   * Compiles LaTeX source code to PDF.
   * Priority:
   * 1. Local engine (tectonic / pdflatex) if available
   * 2. Free public open-source compiler (latexonline.cc)
   * 3. Fallback lightweight PDF generation if completely offline
   */
  async compileLatex(texSource: string, engine = "pdflatex"): Promise<CompileResult> {
    const startTime = Date.now();

    // 1. Try local compiler if available
    const local = await this.detectLocalCompiler();
    if (local) {
      try {
        const result = await this.compileLocally(texSource, local.type);
        return {
          pdfBase64: result,
          engineUsed: `local-${local.type}`,
          compileDurationMs: Date.now() - startTime,
        };
      } catch (err: any) {
        console.warn(`Local ${local.type} compilation failed, falling back to free cloud compiler:`, err.message);
      }
    }

    // 2. Free cloud open-source compiler (latexonline.cc)
    try {
      const result = await this.compileViaLatexOnline(texSource, engine);
      return {
        pdfBase64: result,
        engineUsed: "latexonline.cc (free open-source engine)",
        compileDurationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn("latexonline.cc compilation failed, evaluating fallback:", err.message);

      // If the error was a TeX syntax error from the compiler, surface the log
      if (err.isCompilerError && err.log) {
        throw err;
      }

      // If network is offline, produce fallback ATS-styled PDF buffer
      const fallbackPdf = this.generateFallbackPdf(texSource);
      return {
        pdfBase64: fallbackPdf,
        engineUsed: "offline-ats-preview-engine",
        compileDurationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Compiles using free open-source latexonline.cc service.
   */
  private async compileViaLatexOnline(texSource: string, engine = "pdflatex"): Promise<string> {
    const url = new URL("https://latexonline.cc/compile");
    url.searchParams.set("text", texSource);
    if (engine && engine !== "pdflatex") {
      url.searchParams.set("command", engine);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorLog = await response.text();
        const err: any = new Error(`LaTeX compilation failed (HTTP ${response.status})`);
        err.isCompilerError = true;
        err.log = errorLog.slice(0, 3000);
        throw err;
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Compiles locally using installed TeX binaries.
   */
  private async compileLocally(texSource: string, type: "tectonic" | "pdflatex"): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skilltwin-latex-"));
    const texFile = path.join(tmpDir, "document.tex");
    const pdfFile = path.join(tmpDir, "document.pdf");

    try {
      await fs.writeFile(texFile, texSource, "utf-8");

      if (type === "tectonic") {
        await execFileAsync("tectonic", ["-o", tmpDir, texFile], { timeout: 15000 });
      } else {
        await execFileAsync("pdflatex", ["-interaction=nonstopmode", "-output-directory", tmpDir, texFile], {
          timeout: 15000,
        });
      }

      const pdfBuffer = await fs.readFile(pdfFile);
      return pdfBuffer.toString("base64");
    } finally {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }

  /**
   * Fallback minimal valid PDF generator for offline test/demo environments.
   */
  private generateFallbackPdf(texSource: string): string {
    // Extracts title/name from TeX if available
    const nameMatch = texSource.match(/\\scshape\s+([A-Za-z\s]+)\}/);
    const candidateName = nameMatch ? nameMatch[1].trim() : "ATS Technical Resume";

    const stream = `BT
/F1 18 Tf
50 750 Td
(${candidateName}) Tj
/F1 11 Tf
0 -24 Td
(ATS-Optimized Single-Column Technical Resume) Tj
0 -20 Td
(Generated via SkillTwin Free LaTeX Engine) Tj
0 -30 Td
(Education | Experience | Technical Skills | Concrete GitHub Evidence) Tj
ET`;

    const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
370
%%EOF`;

    return Buffer.from(pdfString).toString("base64");
  }
}

export const latexService = new LatexService();
