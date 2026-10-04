import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Layers, ArrowRight } from "lucide-react";
import { Button } from "../common/Button.js";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import type { ResumeExtraction } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ResumeUploadViewProps {
  currentResume: ResumeExtraction | null;
  onUploadFile?: (file: File) => void;
  onUploadText: (fileName: string, text: string) => void;
  onLoadSample: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  loading: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const ResumeUploadView: React.FC<ResumeUploadViewProps> = ({
  currentResume,
  onUploadFile,
  onUploadText,
  onLoadSample,
  onNavigate,
  loading,
  errorMessage,
  onClearError,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState("Pasted_Resume.txt");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
    setSelectedFileName(file.name);

    if (onUploadFile) {
      onUploadFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onUploadText(file.name, content || "Resume content uploaded");
      };
      reader.readAsText(file);
    }
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
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Resume Evidence Ingestion
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Upload your technical resume in PDF, DOCX, or text format. SkillTwin extracts claimed skills,
            projects, and work evidence for canonical taxonomy mapping.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Layers size={13} />}
          onClick={onLoadSample}
        >
          Load Verified Sample Resume
        </Button>
      </div>

      {/* Upload Panel */}
      <div style={{ display: "grid", gridTemplateColumns: currentResume ? "1.2fr 1fr" : "1fr", gap: "20px" }}>
        <Card
          title={
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                File Upload (PDF / Text)
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
          {activeTab === "upload" ? (
            <div>
              <div
                className={`dropzone ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-file-input")?.click()}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
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
                    margin: "0 auto 16px",
                    color: "var(--text-accent)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <UploadCloud size={24} />
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                  Drag & drop your resume file here
                </h4>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Supports PDF, DOCX, and TXT files (Max 5MB)
                </p>
                <Button variant="secondary" size="sm" loading={loading}>
                  Choose File from Computer
                </Button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <span>✓ Client-side sanitized text pipeline</span>
                <span>🔒 Never stored or shared publicly</span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Document Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Paste Resume Plain Text
                </label>
                <textarea
                  rows={10}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full text of your resume here (Contact, Skills, Projects, Experience, Education)..."
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button
                  variant="primary"
                  disabled={!pastedText.trim()}
                  loading={loading}
                  onClick={() => onUploadText(fileName, pastedText)}
                >
                  Analyze Pasted Resume
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Ingestion Status Summary (when active) */}
        {currentResume && (
          <Card
            title="Active Ingestion Summary"
            action={<Badge variant="match">Extracted</Badge>}
            description={currentResume.fileName}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "14px",
                  background: "var(--bg-elevated)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Candidate
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {currentResume.profile.name || "Unknown"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Claimed Skills
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-accent)", marginTop: "2px" }}>
                    {currentResume.skillsClaimed.length} Skills
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Projects Detected
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {currentResume.projects.length} Projects
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Experience Roles
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {currentResume.experience.length} Roles
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                ✓ Clean text extraction complete ({currentResume.rawText.length} characters parsed).
                <br />
                ✓ Claimed skills indexed for canonical taxonomy normalization.
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight size={13} />}
                  onClick={() => onNavigate("skill_matrix")}
                >
                  Generate Skill Matrix
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FileText size={13} />}
                  onClick={() => onNavigate("resume_view")}
                >
                  Inspect Structured Data
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
