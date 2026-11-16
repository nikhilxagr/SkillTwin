import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileCode,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Sliders,
  ShieldCheck,
  Info,
  ChevronRight,
  Code2,
} from "lucide-react";
import type {
  ResumeExtraction,
  JobSpecificTailoredResume,
  LatexTemplateId,
  LatexFontId,
  LatexMargin,
  PageBudgetEstimate,
} from "@skilltwin/contracts";
import { generateLatexFromResume, calculateResumePageBudget } from "@skilltwin/contracts";
import { compileLatex } from "../../api/client.js";

interface LatexStudioViewProps {
  resume: ResumeExtraction | null;
  tailoredResume?: JobSpecificTailoredResume | null;
  initialTexSource?: string;
  onNavigate?: (screen: string) => void;
}

const DEFAULT_STUDIO_RESUME: ResumeExtraction = {
  id: "studio-default-resume",
  fileName: "ats_resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 105000,
  rawText: "Alex Rivera Full Stack Engineer",
  profile: {
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    location: "San Francisco, CA",
    githubUrl: "https://github.com/alexrivera",
    linkedinUrl: "https://linkedin.com/in/alexrivera",
    summary: "Senior Full Stack Engineer specializing in TypeScript, React, and distributed systems.",
    yearsOfExperienceEstimate: 5,
  },
  skillsClaimed: ["TypeScript", "JavaScript", "Python", "React", "Node.js", "Docker", "PostgreSQL", "REST APIs", "AWS"],
  experience: [
    {
      company: "Linear Technologies",
      role: "Senior Full Stack Engineer",
      startDate: "2022",
      endDate: "Present",
      current: true,
      location: "San Francisco, CA",
      bullets: [
        "Architected scalable microservices supporting 2M+ active monthly users with 99.99% uptime.",
        "Engineered real-time collaboration pipeline reducing end-to-end latency by 45%.",
        "Mentored 6 junior and mid-level engineers in TypeScript and clean code best practices.",
      ],
      technologies: ["TypeScript", "React", "Node.js", "Docker"],
    },
    {
      company: "Apex Cloud Labs",
      role: "Software Engineer",
      startDate: "2020",
      endDate: "2022",
      current: false,
      location: "San Jose, CA",
      bullets: [
        "Developed responsive dashboard interfaces in React and Tailwind CSS.",
        "Implemented high-throughput PostgreSQL query indexing, improving response times by 35%.",
      ],
      technologies: ["React", "PostgreSQL", "Node.js"],
    },
  ],
  projects: [
    {
      name: "PulseEngine",
      role: "Creator & Lead Architect",
      description: "Distributed analytics monitoring engine with sub-second event ingestion.",
      technologies: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
      githubUrl: "https://github.com/alexrivera/pulseengine",
      bullets: [
        "Built distributed event streaming pipeline processing 10,000 operations per second.",
        "Engineered automated health-check alerting with zero false positives.",
      ],
    },
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      startDate: "2016",
      endDate: "2020",
      fieldOfStudy: "Computer Science",
    },
  ],
  certifications: [],
  achievements: [],
  parsedAt: new Date().toISOString(),
};

export const LatexStudioView: React.FC<LatexStudioViewProps> = ({
  resume,
  tailoredResume,
  initialTexSource,
  onNavigate,
}) => {
  const effectiveResume = resume || DEFAULT_STUDIO_RESUME;
  const defaultTex = initialTexSource || generateLatexFromResume(effectiveResume, { tailored: tailoredResume });
  const [texCode, setTexCode] = useState<string>(defaultTex);
  const [templateId, setTemplateId] = useState<LatexTemplateId>("jakes-resume");
  const [font, setFont] = useState<LatexFontId>("computer-modern");
  const [margin, setMargin] = useState<LatexMargin>("normal");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string>("latexonline.cc (free engine)");
  const [compileDuration, setCompileDuration] = useState<number | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate real-time 1-page budget & line density
  const pageBudget: PageBudgetEstimate = useMemo(() => {
    return calculateResumePageBudget(effectiveResume, {
      templateId,
      margin,
      tailored: tailoredResume,
    });
  }, [effectiveResume, templateId, margin, tailoredResume]);

  // Sync initial TeX if resume changes
  useEffect(() => {
    if (resume) {
      const generated = generateLatexFromResume(resume, {
        templateId,
        font,
        margin,
        tailored: tailoredResume,
      });
      setTexCode(generated);
      setPdfBlobUrl(null);
    }
  }, [resume, tailoredResume]);

  const handleTemplateChange = (newTemplateId: LatexTemplateId) => {
    setTemplateId(newTemplateId);
    const newFont: LatexFontId = newTemplateId === "minimal-ats" ? "helvetica" : font;
    setFont(newFont);
    const fresh = generateLatexFromResume(effectiveResume, {
      templateId: newTemplateId,
      font: newFont,
      margin,
      tailored: tailoredResume,
    });
    setTexCode(fresh);
    setPdfBlobUrl(null);
  };

  const handleFontChange = (newFont: LatexFontId) => {
    setFont(newFont);
    const fresh = generateLatexFromResume(effectiveResume, {
      templateId,
      font: newFont,
      margin,
      tailored: tailoredResume,
    });
    setTexCode(fresh);
    setPdfBlobUrl(null);
  };

  const handleMarginChange = (newMargin: LatexMargin) => {
    setMargin(newMargin);
    const fresh = generateLatexFromResume(effectiveResume, {
      templateId,
      font,
      margin: newMargin,
      tailored: tailoredResume,
    });
    setTexCode(fresh);
    setPdfBlobUrl(null);
  };

  const handleAutoFitOnePage = () => {
    setMargin("compact");
    const fresh = generateLatexFromResume(effectiveResume, {
      templateId,
      font,
      margin: "compact",
      tailored: tailoredResume,
    });
    setTexCode(fresh);
    setPdfBlobUrl(null);
  };

  // Clean up blob URL on unmount or update
  useEffect(() => {
    return () => {
      if (pdfBlobUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" && !pdfBlobUrl.startsWith("data:")) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Auto-compile whenever valid TeX code is present and no PDF preview is rendered
  useEffect(() => {
    if (texCode.trim() && !pdfBlobUrl && !isCompiling) {
      handleCompile();
    }
  }, [texCode]);

  const handleCompile = async () => {
    if (!texCode.trim()) return;

    setIsCompiling(true);
    setErrorLog(null);

    try {
      const result = await compileLatex(texCode, "pdflatex");
      setPdfBase64(result.pdfBase64);
      setEngineUsed(result.engineUsed);
      setCompileDuration(result.compileDurationMs);

      // Convert base64 to Blob URL for fast browser rendering
      const byteCharacters = atob(result.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      if (pdfBlobUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" && !pdfBlobUrl.startsWith("data:")) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const url = typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blob)
        : `data:application/pdf;base64,${result.pdfBase64}`;
      setPdfBlobUrl(url);
    } catch (err: any) {
      console.error("Compilation error:", err);
      let rawLog = err.log || err.message || "Compilation failed. Check LaTeX syntax.";
      if (typeof rawLog === "string" && rawLog.includes("<html") && rawLog.includes("414")) {
        rawLog = "Request size exceeded URI limits. Switched to direct POST multipart compilation.";
      } else if (typeof rawLog === "string" && rawLog.startsWith("<") && rawLog.includes("</")) {
        rawLog = rawLog.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
      }
      setErrorLog(rawLog);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSyncFromProfile = () => {
    if (!resume) {
      if (onNavigate) onNavigate("resume_upload");
      return;
    }
    const fresh = generateLatexFromResume(resume, {
      templateId,
      font,
      margin,
      tailored: tailoredResume,
    });
    setTexCode(fresh);
    setPdfBlobUrl(null);
    setErrorLog(null);
  };

  const handleDownloadPdf = async () => {
    let currentBlobUrl = pdfBlobUrl;

    // If PDF is not yet compiled, compile on-demand before downloading
    if (!currentBlobUrl && texCode.trim()) {
      setIsCompiling(true);
      setErrorLog(null);
      try {
        const result = await compileLatex(texCode, "pdflatex");
        setPdfBase64(result.pdfBase64);
        setEngineUsed(result.engineUsed);
        setCompileDuration(result.compileDurationMs);

        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        currentBlobUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(blob)
          : `data:application/pdf;base64,${result.pdfBase64}`;
        setPdfBlobUrl(currentBlobUrl);
      } catch (err: any) {
        let rawLog = err.log || err.message || "Compilation failed. Check LaTeX syntax.";
        setErrorLog(rawLog);
        setIsCompiling(false);
        return;
      } finally {
        setIsCompiling(false);
      }
    }

    if (currentBlobUrl) {
      const a = document.createElement("a");
      a.href = currentBlobUrl;
      const downloadName = (effectiveResume.profile.name || "Resume").replace(/\s+/g, "_");
      a.download = `${downloadName}_ATS.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([texCode], { type: "text/x-tex;charset=utf-8" });
    const url = typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(blob)
      : `data:text/x-tex;charset=utf-8,${encodeURIComponent(texCode)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume?.profile.name || "resume").toLowerCase().replace(/\s+/g, "_")}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" && !url.startsWith("data:")) {
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyTex = () => {
    navigator.clipboard.writeText(texCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Support Tab key indentation inside the LaTeX textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = texCode.substring(0, start) + "  " + texCode.substring(end);
      setTexCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lineCount = texCode.split("\n").length;

  return (
    <div className="space-y-4 pb-12 animate-fade-in" data-testid="latex-studio-view">
      {/* Top Header & Action Bar */}
      <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-brand-blue rounded-lg border border-blue-100 shrink-0">
              <FileCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-content-primary">
                  LaTeX Resume Studio & Compiler
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  100% Free Compiler
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-brand-blue border border-blue-200">
                  Jake's Resume ATS Standard
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                Overleaf-style split-screen editor. Compiles LaTeX code directly into ATS-friendly, machine-readable PDF resumes.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncFromProfile}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-content-primary text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Re-generate LaTeX code from your SkillTwin profile & tailored bullets"
              data-testid="sync-profile-btn"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>Sync from Profile</span>
            </button>

            <button
              onClick={handleDownloadTex}
              className="px-3 py-1.5 border border-border-subtle hover:bg-surface-subtle text-content-secondary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              title="Download .tex source code to use in Overleaf or local TeX Live"
              data-testid="download-tex-btn"
            >
              <Code2 size={14} />
              <span>Download .tex</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isCompiling || !texCode.trim()}
              className="px-3 py-1.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Download compiled ATS PDF"
              data-testid="download-pdf-btn"
            >
              {isCompiling && !pdfBlobUrl ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-blue-600" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleCompile}
              disabled={isCompiling || !texCode.trim()}
              className="px-4 py-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              data-testid="compile-latex-btn"
            >
              {isCompiling ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Compile PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ATS Compliance Highlights Bar */}
        <div className="mt-4 pt-3.5 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-content-secondary">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>Single-column ATS format</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>glyphtounicode Unicode mapping</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>No tables/graphics breaking OCR</span>
          </div>
          <div className="flex items-center gap-1.5 text-content-tertiary">
            <Info size={14} className="text-blue-500 shrink-0" />
            <span>Overleaf & TeX Live compatible</span>
          </div>
        </div>
      </div>

      {/* Template Selection, Typography & Smart 1-Page Budgeting Bar */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Template Selector Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-content-primary mr-1 flex items-center gap-1.5">
              <Sliders size={14} className="text-brand-blue" />
              <span>ATS Template:</span>
            </span>

            <button
              onClick={() => handleTemplateChange("jakes-resume")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                templateId === "jakes-resume"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-content-secondary"
              }`}
              data-testid="template-jakes-btn"
            >
              <span>📄 Jake's Resume (Standard)</span>
            </button>

            <button
              onClick={() => handleTemplateChange("minimal-ats")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                templateId === "minimal-ats"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-content-secondary"
              }`}
              data-testid="template-minimal-btn"
            >
              <span>📑 Minimalist Swiss (Clean)</span>
            </button>

            <button
              onClick={() => handleTemplateChange("executive-standard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                templateId === "executive-standard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-content-secondary"
              }`}
              data-testid="template-executive-btn"
            >
              <span>💼 Executive Standard (Leadership)</span>
            </button>
          </div>

          {/* Typography & Margins Controls */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-content-tertiary">Font:</span>
              <select
                value={font}
                onChange={(e) => handleFontChange(e.target.value as LatexFontId)}
                className="px-2 py-1 bg-slate-50 border border-border-subtle rounded-md text-xs font-medium text-content-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="font-select"
              >
                <option value="computer-modern">Computer Modern</option>
                <option value="helvetica">Helvetica (Sans)</option>
                <option value="times">Times Roman (Serif)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-content-tertiary">Margin:</span>
              <select
                value={margin}
                onChange={(e) => handleMarginChange(e.target.value as LatexMargin)}
                className="px-2 py-1 bg-slate-50 border border-border-subtle rounded-md text-xs font-medium text-content-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="margin-select"
              >
                <option value="compact">Compact (High Density)</option>
                <option value="normal">Normal (0.5in ATS)</option>
                <option value="spacious">Spacious (Executive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Smart 1-Page Budgeting Indicator */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-content-tertiary font-medium">Page Budget:</span>
            {pageBudget.status === "optimal-one-page" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]" data-testid="budget-status-optimal">
                <CheckCircle2 size={12} />
                <span>Optimal 1-Page Fit ({pageBudget.estimatedLines} lines)</span>
              </span>
            )}
            {pageBudget.status === "risk-overflow" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]" data-testid="budget-status-risk">
                <AlertTriangle size={12} />
                <span>Risk of 2-Page Overflow ({pageBudget.estimatedLines} lines)</span>
              </span>
            )}
            {pageBudget.status === "two-pages-plus" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]" data-testid="budget-status-twopage">
                <FileText size={12} />
                <span>Senior 2-Page Format ({pageBudget.estimatedPages} pages)</span>
              </span>
            )}

            <span className="text-content-tertiary text-[11px] hidden sm:inline">
              • {pageBudget.recommendation}
            </span>
          </div>

          {pageBudget.status === "risk-overflow" && margin !== "compact" && (
            <button
              onClick={handleAutoFitOnePage}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-semibold text-[11px] transition-colors flex items-center gap-1 self-start sm:self-auto"
              data-testid="autofit-btn"
            >
              <span>Auto-Fit to 1 Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Overleaf-Style Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[750px]">
        {/* LEFT COLUMN: LaTeX Source Code Editor */}
        <div className="bg-white border border-border-subtle rounded-xl flex flex-col shadow-sm overflow-hidden h-[480px] lg:h-full">
          {/* Editor Header */}
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sky-400">resume.tex</span>
              <span className="text-slate-400">({lineCount} lines)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorFontSize((prev) => Math.max(11, prev - 1))}
                className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setEditorFontSize((prev) => Math.min(18, prev + 1))}
                className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
                title="Increase font size"
              >
                A+
              </button>

              <button
                onClick={handleCopyTex}
                className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-1 text-[11px]"
                title="Copy LaTeX source code"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Editor Textarea */}
          <div className="flex-1 relative bg-slate-950 flex font-mono">
            <textarea
              ref={textareaRef}
              value={texCode}
              onChange={(e) => setTexCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{ fontSize: `${editorFontSize}px`, lineHeight: "1.55" }}
              className="flex-1 p-4 bg-transparent text-slate-100 font-mono resize-none focus:outline-none focus:ring-0 border-0 leading-relaxed selection:bg-blue-600/40"
              placeholder="% Type or paste your LaTeX resume code here..."
              data-testid="latex-editor-textarea"
            />
          </div>

          {/* Editor Footer Status */}
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Engine: pdflatex | UTF-8</span>
            <span>Tab = 2 spaces</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Live PDF Preview & Compilation Feedback */}
        <div className="bg-white border border-border-subtle rounded-xl flex flex-col shadow-sm overflow-hidden h-[540px] lg:h-full">
          {/* Preview Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium text-content-primary">
              <FileText size={15} className="text-brand-blue" />
              <span>Compiled PDF Document</span>
              {compileDuration && (
                <span className="text-[11px] text-content-tertiary">
                  ({(compileDuration / 1000).toFixed(2)}s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="px-2 py-0.5 bg-white border border-border-subtle rounded hover:bg-slate-100 text-content-secondary text-[11px]"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[11px] font-mono text-content-secondary min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(160, z + 10))}
                className="px-2 py-0.5 bg-white border border-border-subtle rounded hover:bg-slate-100 text-content-secondary text-[11px]"
                title="Zoom In"
              >
                +
              </button>

              {pdfBlobUrl && (
                <a
                  href={pdfBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-content-secondary hover:text-brand-blue rounded hover:bg-white"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Preview Content Area */}
          <div className="flex-1 bg-slate-100 relative overflow-auto flex flex-col items-center p-3">
            {isCompiling && (
              <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={28} className="animate-spin text-brand-blue" />
                <span className="text-xs font-semibold text-content-primary">
                  Compiling LaTeX document...
                </span>
                <span className="text-[11px] text-content-tertiary">
                  Building machine-readable ATS PDF via free engine
                </span>
              </div>
            )}

            {errorLog ? (
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2 animate-fade-in my-auto">
                <div className="flex items-center gap-2 text-red-800 font-bold">
                  <AlertTriangle size={16} />
                  <span>LaTeX Compilation Error</span>
                </div>
                <p className="text-red-700">
                  The TeX engine encountered a syntax error while processing your code:
                </p>
                <pre className="p-3 bg-red-950 text-red-200 rounded text-[11px] font-mono overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {errorLog}
                </pre>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-red-600 text-[11px]">
                    Tip: Verify that all special characters (%, $, &, _) are escaped with a backslash.
                  </span>
                  <button
                    onClick={handleSyncFromProfile}
                    className="px-3 py-1 bg-red-800 text-white rounded text-xs hover:bg-red-900"
                  >
                    Reset to Valid Template
                  </button>
                </div>
              </div>
            ) : pdfBlobUrl ? (
              <div
                style={{
                  width: `${zoomLevel}%`,
                  height: "100%",
                  transition: "width 0.15s ease-out",
                }}
                className="h-full flex flex-col items-center shadow-md bg-white rounded overflow-hidden"
              >
                <iframe
                  src={`${pdfBlobUrl}#view=FitH&toolbar=0`}
                  title="PDF Preview"
                  className="w-full h-full border-0 min-h-[500px]"
                  data-testid="pdf-preview-iframe"
                />
              </div>
            ) : (
              <div className="my-auto text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue mx-auto flex items-center justify-center">
                  <FileCode size={24} />
                </div>
                <h3 className="font-bold text-sm text-content-primary">
                  Ready to Compile ATS Resume
                </h3>
                <p className="text-xs text-content-secondary max-w-sm mx-auto">
                  Click the <strong>Compile PDF</strong> button to generate your 100% free, ATS-friendly single-column resume.
                </p>
                <button
                  onClick={handleCompile}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Compile Now
                </button>
              </div>
            )}
          </div>

          {/* Preview Footer Engine Indicator */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-border-subtle text-[11px] text-content-tertiary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Compiled with: {engineUsed}</span>
            </span>
            <span>100% Free Open-Source TeX Service</span>
          </div>
        </div>
      </div>
    </div>
  );
};
