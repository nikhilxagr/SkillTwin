import React, { useState } from "react";
import {
  UploadCloud,
  Briefcase,
  Layers,
  ArrowRight,
  Building,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "../common/Button.js";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import type { JobExtraction } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface JobUploadViewProps {
  currentJob: JobExtraction | null;
  onUploadFile?: (file: File, fallbackTitle?: string, fallbackCompany?: string) => void;
  onUploadJob: (title: string, company: string, text: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  loading: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  onRunGapAnalysis?: () => void;
}

export const JobUploadView: React.FC<JobUploadViewProps> = ({
  currentJob,
  onUploadFile,
  onUploadJob,
  onNavigate,
  loading,
  errorMessage,
  onClearError,
  onRunGapAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("paste");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    if (onClearError) onClearError();
    setSelectedFile(file);
  };

  const handleSubmitFile = () => {
    if (!selectedFile) return;
    if (onUploadFile) {
      onUploadFile(selectedFile, jobTitle.trim() || undefined, company.trim() || undefined);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onUploadJob(jobTitle || selectedFile.name.replace(/\.[^/.]+$/, ""), company, content || "");
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmitText = () => {
    if (!jdText.trim()) return;
    onUploadJob(jobTitle.trim() || "Target Role", company.trim(), jdText.trim());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              style={{
                background: "transparent",
                border: "none",
                color: "#f87171",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Target Job Description Ingestion
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Upload or paste the job posting you want to benchmark against. SkillTwin extracts required vs. preferred
            competencies, experience criteria, and keywords normalized via the Skill Engine.
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${currentJob ? "lg:grid-cols-12" : ""} gap-5`}>
        {/* Input Panel */}
        <div className={currentJob ? "lg:col-span-7" : ""}>
          <Card
            title={
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
                  onClick={() => setActiveTab("upload")}
                >
                  File Upload (PDF / TXT)
                </button>
                <button
                  className={`tab-btn ${activeTab === "paste" ? "active" : ""}`}
                  onClick={() => setActiveTab("paste")}
                >
                  Direct Text Paste
                </button>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Role Title and Company Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Target Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Linear, Vercel"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            {activeTab === "upload" ? (
              <div>
                <div
                  className={`dropzone ${dragActive ? "active" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("jd-file-input")?.click()}
                  style={{
                    border: dragActive ? "2px dashed var(--border-accent)" : "2px dashed var(--border-subtle)",
                    borderRadius: "10px",
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragActive ? "var(--bg-hover)" : "var(--bg-canvas)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    id="jd-file-input"
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  />
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "var(--bg-elevated)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                      color: "var(--text-accent)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
                    Drag & drop job description file
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                    Supports PDF and TXT documents (Max 5MB)
                  </p>
                  <Button variant="secondary" size="sm" loading={loading}>
                    Choose File from Computer
                  </Button>
                </div>

                {selectedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "14px",
                      padding: "10px 14px",
                      background: "var(--bg-elevated)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={18} color="var(--text-accent)" />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{selectedFile.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    ✓ Automated text extraction & skill alias normalization
                  </span>
                  <Button
                    variant="primary"
                    disabled={!selectedFile}
                    loading={loading}
                    onClick={handleSubmitFile}
                  >
                    Extract & Analyze File
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Job Description Plain Text (Requirements, Responsibilities, Qualifications)
                  </label>
                  <textarea
                    rows={12}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the full job description here..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      background: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "12.5px",
                      fontFamily: "var(--font-mono)",
                      lineHeight: "1.5",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                  <Button
                    variant="primary"
                    disabled={!jdText.trim()}
                    loading={loading}
                    onClick={handleSubmitText}
                  >
                    Analyze Job Description
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Current Active JD Preview (if loaded) */}
      {currentJob && (
        <div className="lg:col-span-5">
          <Card
            title="Active Target Benchmark"
            description={`${currentJob.title} ${currentJob.company ? `@ ${currentJob.company}` : ""}`}
            action={<Badge variant="match">Analyzed</Badge>}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Experience Requirement
                  </span>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {currentJob.experience.description || `${currentJob.experience.level} (${currentJob.experience.minYears || 0}+ yrs)`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Required Skills
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-gap)", marginTop: "2px" }}>
                    {currentJob.requiredSkills.length} Mandatory
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Preferred Skills
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", marginTop: "2px" }}>
                    {currentJob.preferredSkills.length} Nice-to-Have
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Keywords Indexed
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-accent)", marginTop: "2px" }}>
                    {Object.values(currentJob.keywords).flat().length} Keywords
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Taxonomy mapping ready with canonical normalized skills and requirements breakdown.
              </div>

              <div className="flex flex-wrap gap-2.5 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight size={13} />}
                  onClick={() => onNavigate("jd_analysis")}
                >
                  View Extracted Intelligence
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRunGapAnalysis || (() => onNavigate("gap_analysis"))}
                >
                  Run Gap Analysis
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};
