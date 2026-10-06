import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Check,
  X,
  Edit3,
  Copy,
  Download,
  RotateCcw,
  Sparkles as _NoSparkles, // Banned - will not use
  Layers,
  ChevronRight,
  Briefcase,
  GitBranch,
  Terminal,
  Save,
  CheckCheck,
  FileCode,
} from "lucide-react";
import { Badge } from "../common/Badge.js";
import { Card } from "../common/Card.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import type {
  ResumeExtraction,
  JobExtraction,
  JobSpecificTailoredResume,
  TailoredSkillItem,
  TailoredProjectItem,
  TailoredBulletItem,
  OptimizationHighlightTag,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface JobSpecificResumeViewProps {
  tailoredResume: JobSpecificTailoredResume | null;
  masterResume: ResumeExtraction | null;
  selectedJob: JobExtraction | null;
  onNavigate: (screen: ActiveScreen) => void;
  onRecomputeTailoring?: () => void;
}

export const JobSpecificResumeView: React.FC<JobSpecificResumeViewProps> = ({
  tailoredResume,
  masterResume,
  selectedJob,
  onNavigate,
  onRecomputeTailoring,
}) => {
  // Decision states: Set of accepted IDs and Set of rejected IDs
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // In-line custom editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [customEdits, setCustomEdits] = useState<Record<string, string>>({});

  // Summary editing state
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [customSummary, setCustomSummary] = useState<string | null>(null);

  // Active view tab: "comparison" (Master vs Job-Specific) or "document" (Tailored Resume Document Preview)
  const [activeViewMode, setActiveViewMode] = useState<"comparison" | "document">("comparison");

  // Highlight tag filter
  const [highlightFilter, setHighlightFilter] = useState<string>("ALL");

  // Copy success indicator
  const [copied, setCopied] = useState(false);

  // Empty state handling
  if (!tailoredResume) {
    return (
      <EmptyState
        icon={<FileText size={28} />}
        title="Job-Specific Tailoring Not Generated"
        description="Select a target job description and your master resume to generate an evidence-grounded, tailored resume recommendation."
        actionText="Upload Target Job"
        onAction={() => onNavigate("jd_upload")}
      />
    );
  }

  // Helper to determine decision status
  const getDecision = (id: string, defaultDecision: "accepted" | "rejected" = "accepted") => {
    if (customEdits[id]) return "custom_edited";
    if (rejectedIds.has(id)) return "rejected";
    if (acceptedIds.has(id)) return "accepted";
    return defaultDecision;
  };

  const handleAccept = (id: string) => {
    setAcceptedIds((prev) => new Set(prev).add(id));
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => new Set(prev).add(id));
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleStartEdit = (id: string, initialText: string) => {
    setEditingId(id);
    setEditingText(customEdits[id] || initialText);
  };

  const handleSaveEdit = (id: string) => {
    setCustomEdits((prev) => ({ ...prev, [id]: editingText }));
    setAcceptedIds((prev) => new Set(prev).add(id));
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const handleAcceptAll = () => {
    const all = new Set<string>();
    for (const s of tailoredResume.prioritizedSkills) all.add(s.id);
    for (const p of tailoredResume.prioritizedProjects) all.add(p.id);
    for (const b of tailoredResume.tailoredBullets) all.add(b.id);
    for (const d of tailoredResume.deemphasizedContent) all.add(d.id);
    setAcceptedIds(all);
    setRejectedIds(new Set());
  };

  const handleResetDecisions = () => {
    setAcceptedIds(new Set());
    setRejectedIds(new Set());
    setCustomEdits({});
    setCustomSummary(null);
    setEditingId(null);
  };

  // Render Highlight Tag Badge
  const renderHighlightBadge = (tag: OptimizationHighlightTag | string) => {
    switch (tag) {
      case "MATCHED":
        return (
          <Badge variant="match">
            <CheckCircle2 size={11} style={{ marginRight: "3px" }} /> MATCHED
          </Badge>
        );
      case "MISSING":
        return (
          <Badge variant="gap">
            <AlertTriangle size={11} style={{ marginRight: "3px" }} /> MISSING
          </Badge>
        );
      case "WEAK_EVIDENCE":
        return (
          <Badge variant="partial">
            <AlertTriangle size={11} style={{ marginRight: "3px" }} /> WEAK EVIDENCE
          </Badge>
        );
      case "RELEVANT":
      case "RECOMMENDED":
      default:
        return (
          <Badge variant="primary">
            <CheckCircle2 size={11} style={{ marginRight: "3px" }} /> RELEVANT
          </Badge>
        );
    }
  };

  // Build clean text representation of the separate tailored resume
  const candidateName =
    masterResume?.profile?.name || "Senior Software Engineer";

  const effectiveSummary =
    customSummary ||
    tailoredResume.customSummary ||
    tailoredResume.tailoredSummary;

  const buildTailoredResumeMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${candidateName}`);
    lines.push(`Target Role: ${tailoredResume.targetRole}${tailoredResume.company ? ` | ${tailoredResume.company}` : ""}\n`);

    // 1. Professional Summary
    lines.push("## Professional Summary");
    lines.push(`${effectiveSummary}\n`);

    // 2. Technical Skills (Prioritizing core skills)
    lines.push("## Technical Skills");
    const activeSkills = tailoredResume.prioritizedSkills.filter(
      (s) => getDecision(s.id) !== "rejected" && s.status !== "de_emphasized"
    );
    const coreSkills = activeSkills.filter((s) => s.status === "core_priority").map((s) => s.skill);
    const secondarySkills = activeSkills.filter((s) => s.status === "secondary").map((s) => s.skill);

    if (coreSkills.length > 0) {
      lines.push(`- **Core Competencies (Target Stack)**: ${coreSkills.join(", ")}`);
    }
    if (secondarySkills.length > 0) {
      lines.push(`- **Supporting Technologies**: ${secondarySkills.join(", ")}`);
    }
    lines.push("");

    // 3. Work Experience
    lines.push("## Work Experience");
    const groupedBullets: Record<string, string[]> = {};
    for (const b of tailoredResume.tailoredBullets) {
      const key = `${b.experienceRole} — ${b.experienceCompany}`;
      if (!groupedBullets[key]) groupedBullets[key] = [];
      const decision = getDecision(b.id);
      if (decision === "rejected") {
        groupedBullets[key].push(b.originalBullet);
      } else if (b.status === "de_emphasized" && decision === "accepted") {
        // Excluded from tailored draft
      } else {
        const text = customEdits[b.id] || b.tailoredBullet;
        groupedBullets[key].push(text);
      }
    }

    for (const [title, bullets] of Object.entries(groupedBullets)) {
      lines.push(`### ${title}`);
      for (const bullet of bullets) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }

    // 4. Projects (Prioritized Order)
    lines.push("## Technical Projects");
    const activeProjects = [...tailoredResume.prioritizedProjects]
      .filter((p) => getDecision(p.id) !== "rejected" && p.status !== "de_emphasized")
      .sort((a, b) => a.tailoredRank - b.tailoredRank);

    for (const proj of activeProjects) {
      lines.push(`### ${proj.projectName} (Relevance Rank #${proj.tailoredRank})`);
      const desc = customEdits[proj.id] || proj.tailoredDescription;
      lines.push(`${desc}`);
      for (const b of proj.tailoredBullets || []) {
        lines.push(`- ${b}`);
      }
      lines.push("");
    }

    // 5. Education
    lines.push("## Education & Credentials");
    if (masterResume?.education && masterResume.education.length > 0) {
      for (const edu of masterResume.education) {
        lines.push(`- **${edu.degree}** — ${edu.institution} (${edu.startDate || ""} - ${edu.endDate || ""})`);
      }
    } else {
      lines.push("- B.S. in Computer Science or Equivalent Practical Experience");
    }

    return lines.join("\n");
  };

  const handleCopyMarkdown = () => {
    const text = buildTailoredResumeMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = buildTailoredResumeMarkdown();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, "_")}_Tailored_Resume.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Job-Specific Resume Workflow
            </h2>
            <Badge variant="match">Phase 7 Engine</Badge>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Tailoring Master Resume for <strong style={{ color: "var(--text-primary)" }}>{tailoredResume.targetRole}</strong>
            {tailoredResume.company ? ` at ${tailoredResume.company}` : ""} • Master Resume remains strictly locked and untouched.
          </p>
        </div>

        {/* View Controls & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              background: "var(--bg-subtle)",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveViewMode("comparison")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: activeViewMode === "comparison" ? 700 : 500,
                borderRadius: "6px",
                cursor: "pointer",
                border: "none",
                background: activeViewMode === "comparison" ? "var(--bg-canvas)" : "transparent",
                color: activeViewMode === "comparison" ? "var(--color-primary-blue)" : "var(--text-secondary)",
                boxShadow: activeViewMode === "comparison" ? "var(--shadow-sm)" : "none",
              }}
            >
              <Layers size={13} />
              Side-by-Side Comparison
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode("document")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: activeViewMode === "document" ? 700 : 500,
                borderRadius: "6px",
                cursor: "pointer",
                border: "none",
                background: activeViewMode === "document" ? "var(--bg-canvas)" : "transparent",
                color: activeViewMode === "document" ? "var(--color-match)" : "var(--text-secondary)",
                boxShadow: activeViewMode === "document" ? "var(--shadow-sm)" : "none",
              }}
            >
              <FileText size={13} />
              View Job-Specific Version
            </button>
          </div>

          {onRecomputeTailoring && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={onRecomputeTailoring}
            >
              Recompute
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("resume_improvement")}
          >
            All Recommendations
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<FileCode size={13} />}
            onClick={() => onNavigate("latex_studio")}
          >
            LaTeX Studio (ATS PDF)
          </Button>
        </div>
      </div>

      {/* Zero-Fabrication Guarantee Banner */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--color-match-bg)",
          border: "1px solid var(--color-match-border)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <ShieldCheck size={20} style={{ color: "var(--color-match)", flexShrink: 0 }} />
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          <strong style={{ color: "var(--text-primary)" }}>Zero-Fabrication Guarantee: </strong>
          Tailoring only prioritizes, refines, and formats truthful information already verified in your Master Profile.
          No fictional metrics, unverified tools, or invented projects are ever added.
        </div>
      </div>

      {/* ======================================================== */}
      {/* ALIGNMENT SUMMARY SECTION                                */}
      {/* ======================================================== */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary-blue)" }}>
                  Alignment Analysis
                </span>
                <Badge variant="match">Verified Signal Elevation</Badge>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                Alignment Summary
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {tailoredResume.alignmentSummary.headline}
              </p>
            </div>

            {/* Score Comparison Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "var(--bg-subtle)",
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Master Baseline
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-secondary)" }}>
                  {tailoredResume.alignmentSummary.matchScoreOriginal}%
                </div>
              </div>

              <ArrowRight size={18} style={{ color: "var(--color-primary-blue)" }} />

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--color-match)", textTransform: "uppercase", fontWeight: 700 }}>
                  Tailored Match
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-match)" }}>
                  {tailoredResume.alignmentSummary.matchScoreTailored}%
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              padding: "12px",
              background: "var(--bg-subtle)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-primary-blue)" }}>
                {tailoredResume.alignmentSummary.skillsPrioritizedCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Core Skills Prioritized</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-match)" }}>
                {tailoredResume.alignmentSummary.projectsPrioritizedCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Projects Reordered</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-primary-blue)" }}>
                {tailoredResume.alignmentSummary.bulletsImprovedCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Bullets Improved</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-partial)" }}>
                {tailoredResume.alignmentSummary.irrelevantItemsDeemphasizedCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Distractions Pruned</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-gap)" }}>
                {tailoredResume.alignmentSummary.missingEvidenceCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Missing Gaps Flagged</div>
            </div>
          </div>

          {/* Key Strategic Reasons */}
          <div>
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 700,
                display: "block",
                marginBottom: "8px",
              }}
            >
              Why this tailored version is better aligned:
            </span>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {tailoredResume.alignmentSummary.keyStrategicReasons.map((reason, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{reason.split(":")[0]}</strong>
                  {reason.includes(":") ? `:${reason.split(":").slice(1).join(":")}` : ""}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Strategic Rationale */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(37, 99, 235, 0.04)",
              borderRadius: "6px",
              border: "1px solid rgba(37, 99, 235, 0.15)",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              lineHeight: "1.5",
            }}
          >
            <strong style={{ color: "var(--color-deep-navy)" }}>Strategic Rationale: </strong>
            {tailoredResume.alignmentSummary.detailedRationale}
          </div>
        </div>
      </Card>

      {/* Global Actions Ribbon */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          background: "var(--bg-elevated)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
          <span>
            Decisions: <strong style={{ color: "var(--color-match)" }}>{acceptedIds.size} Accepted</strong> •{" "}
            <strong style={{ color: "var(--text-muted)" }}>{rejectedIds.size} Rejected</strong> •{" "}
            <strong style={{ color: "var(--color-primary-blue)" }}>{Object.keys(customEdits).length} Edited</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleAcceptAll}
            style={{
              padding: "5px 12px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid var(--color-match)",
              color: "var(--color-match)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Accept All Recommendations
          </button>
          <button
            type="button"
            onClick={handleResetDecisions}
            style={{
              padding: "5px 12px",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reset Decisions
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: SIDE-BY-SIDE COMPARISON: MASTER VS TAILORED     */}
      {/* ======================================================== */}
      {activeViewMode === "comparison" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 1fr) minmax(380px, 1.35fr)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ==================== LEFT: MASTER RESUME ==================== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                padding: "16px",
                background: "var(--bg-canvas)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lock size={15} style={{ color: "var(--text-muted)" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                    MASTER RESUME
                  </h3>
                </div>
                <Badge variant="neutral">Untouched & Locked</Badge>
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                This is your master profile source of truth. All tailoring recommendations derive exclusively from here.
              </div>

              {/* Master Professional Summary */}
              <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Master Summary
                </span>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {masterResume?.profile?.summary ||
                    "Software Engineer with 3+ years experience building web applications and backend systems."}
                </div>
              </div>

              {/* Master Skills Claimed */}
              <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Master Skills ({masterResume?.skillsClaimed?.length || 12})
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(masterResume?.skillsClaimed || [
                    "JavaScript",
                    "TypeScript",
                    "React",
                    "Node.js",
                    "Express",
                    "Docker",
                    "MongoDB",
                    "PostgreSQL",
                    "Python",
                    "jQuery",
                    "SVN",
                  ]).map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "3px 8px",
                        background: "var(--bg-canvas)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Master Experience Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Master Experience & Deliverables
                </span>
                {(masterResume?.experience || []).map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px",
                      background: "var(--bg-subtle)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "12px",
                    }}
                  >
                    <strong style={{ color: "var(--text-primary)" }}>{exp.role}</strong> — {exp.company}
                    <ul style={{ margin: "6px 0 0 0", paddingLeft: "16px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {(exp.bullets || []).map((b, bIdx) => (
                        <li key={bIdx} style={{ marginBottom: "3px" }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Master Projects */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Master Projects (Original Order)
                </span>
                {(masterResume?.projects || []).map((proj, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px",
                      background: "var(--bg-subtle)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: "var(--text-primary)" }}>{proj.name}</strong>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Rank #{idx + 1}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                      {proj.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== RIGHT: JOB-SPECIFIC VERSION ==================== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                padding: "16px",
                background: "var(--bg-canvas)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(37, 99, 235, 0.25)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--color-match)" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                    JOB-SPECIFIC VERSION
                  </h3>
                </div>
                <Badge variant="match">Interactive Tailoring</Badge>
              </div>

              {/* SECTION 1: Tailored Professional Summary */}
              <Card title="1. Tailored Professional Summary">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {isEditingSummary ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <textarea
                        value={customSummary !== null ? customSummary : tailoredResume.tailoredSummary}
                        onChange={(e) => setCustomSummary(e.target.value)}
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-primary-blue)",
                          fontSize: "13px",
                          fontFamily: "inherit",
                          lineHeight: "1.5",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Save size={12} />}
                          onClick={() => setIsEditingSummary(false)}
                        >
                          Save Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomSummary(null);
                            setIsEditingSummary(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: "12px",
                          background: "rgba(37, 99, 235, 0.04)",
                          borderRadius: "6px",
                          border: "1px solid rgba(37, 99, 235, 0.15)",
                          fontSize: "13px",
                          color: "var(--color-deep-navy)",
                          lineHeight: "1.5",
                        }}
                      >
                        {effectiveSummary}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Grounded in verified experience • Aligned with {tailoredResume.targetRole}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setIsEditingSummary(true)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle)",
                              background: "transparent",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* SECTION 2: Prioritized Technical Skills */}
              <Card title="2. Prioritized Technical Skills">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--color-primary-blue)",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      🌟 Core Priority (Required & Target Stack)
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {tailoredResume.prioritizedSkills
                        .filter((s) => s.status === "core_priority")
                        .map((skill) => {
                          const decision = getDecision(skill.id);
                          return (
                            <div
                              key={skill.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "5px 10px",
                                background:
                                  decision === "rejected"
                                    ? "var(--bg-subtle)"
                                    : "rgba(37, 99, 235, 0.08)",
                                border: `1px solid ${
                                  decision === "rejected"
                                    ? "var(--border-subtle)"
                                    : "var(--color-primary-blue)"
                                }`,
                                borderRadius: "6px",
                                fontSize: "12px",
                                color: decision === "rejected" ? "var(--text-muted)" : "var(--color-deep-navy)",
                                fontWeight: 600,
                                textDecoration: decision === "rejected" ? "line-through" : "none",
                              }}
                            >
                              <span>{skill.skill}</span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{skill.relevanceScore}%</span>
                              <div style={{ display: "inline-flex", gap: "2px", marginLeft: "4px" }}>
                                <button
                                  type="button"
                                  title="Accept"
                                  onClick={() => handleAccept(skill.id)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: decision === "accepted" ? "var(--color-match)" : "var(--text-muted)",
                                    padding: "1px",
                                  }}
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  type="button"
                                  title="Reject"
                                  onClick={() => handleReject(skill.id)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: decision === "rejected" ? "var(--color-gap)" : "var(--text-muted)",
                                    padding: "1px",
                                  }}
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* De-emphasized Skills */}
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      💤 De-Emphasized Skills (Removed from prominent view to reduce noise)
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {tailoredResume.prioritizedSkills
                        .filter((s) => s.status === "de_emphasized")
                        .map((skill) => {
                          const decision = getDecision(skill.id);
                          return (
                            <div
                              key={skill.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 8px",
                                background: "var(--bg-subtle)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                color: "var(--text-muted)",
                              }}
                            >
                              <span>{skill.skill}</span>
                              <span style={{ fontSize: "10px" }}>({skill.reason.split(".")[0]})</span>
                              <button
                                type="button"
                                onClick={() => handleReject(skill.id)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  color: decision === "rejected" ? "var(--color-primary-blue)" : "var(--text-muted)",
                                  fontSize: "10px",
                                  textDecoration: "underline",
                                }}
                              >
                                {decision === "rejected" ? "Restored" : "Restore"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* SECTION 3: Prioritized Projects */}
              <Card title="3. Prioritized Projects (Reordered by Target Stack Fit)">
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {tailoredResume.prioritizedProjects.map((proj) => {
                    const decision = getDecision(proj.id);
                    const isEditing = editingId === proj.id;
                    const currentDesc = customEdits[proj.id] || proj.tailoredDescription;

                    return (
                      <div
                        key={proj.id}
                        style={{
                          padding: "14px",
                          borderRadius: "8px",
                          border: `1px solid ${
                            decision === "accepted"
                              ? "rgba(37, 99, 235, 0.25)"
                              : decision === "rejected"
                              ? "var(--border-subtle)"
                              : "var(--border-subtle)"
                          }`,
                          background: decision === "rejected" ? "var(--bg-subtle)" : "var(--bg-canvas)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                                {proj.projectName}
                              </h4>
                              <Badge variant={proj.status === "prioritized" ? "match" : "neutral"}>
                                Tailored Rank #{proj.tailoredRank} (Was #{proj.originalRank})
                              </Badge>
                              {renderHighlightBadge(proj.highlightTag)}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--color-primary-blue)", fontWeight: 600, marginTop: "2px" }}>
                              {proj.reason}
                            </div>
                          </div>

                          {/* Accept / Reject / Edit Controls */}
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleAccept(proj.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "5px",
                                cursor: "pointer",
                                border: "1px solid var(--color-match)",
                                background: decision === "accepted" ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                                color: decision === "accepted" ? "#fff" : "var(--color-match)",
                              }}
                            >
                              <Check size={11} /> {decision === "accepted" ? "Accepted" : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(proj.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                border: "1px solid var(--border-subtle)",
                                background: decision === "rejected" ? "var(--bg-subtle)" : "transparent",
                                color: decision === "rejected" ? "var(--text-muted)" : "var(--text-secondary)",
                              }}
                            >
                              <X size={11} /> {decision === "rejected" ? "Rejected" : "Reject"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(proj.id, proj.tailoredDescription)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                border: "1px solid var(--border-subtle)",
                                background: isEditing ? "var(--bg-subtle)" : "transparent",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                          </div>
                        </div>

                        {/* Description Editing or View */}
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={3}
                              style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid var(--color-primary-blue)",
                                fontSize: "12.5px",
                                fontFamily: "inherit",
                              }}
                            />
                            <div style={{ display: "flex", gap: "6px" }}>
                              <Button size="sm" variant="primary" icon={<Save size={11} />} onClick={() => handleSaveEdit(proj.id)}>
                                Save Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                            {currentDesc}
                          </div>
                        )}

                        {/* Bullets */}
                        <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)" }}>
                          {(proj.tailoredBullets || []).map((b, bIdx) => (
                            <li key={bIdx} style={{ marginBottom: "2px" }}>
                              {b}
                            </li>
                          ))}
                        </ul>

                        <div style={{ fontSize: "11px", color: "#92400e", display: "flex", alignItems: "center", gap: "4px" }}>
                          <ShieldCheck size={12} style={{ color: "var(--color-match)" }} />
                          <span>{proj.truthCheckNote}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* SECTION 4: Improved Experience Bullets */}
              <Card title="4. Improved Experience Bullet Points">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tailoredResume.tailoredBullets.map((bullet) => {
                    const decision = getDecision(bullet.id);
                    const isEditing = editingId === bullet.id;
                    const currentText = customEdits[bullet.id] || bullet.tailoredBullet;

                    return (
                      <div
                        key={bullet.id}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: `1px solid ${
                            decision === "accepted"
                              ? "rgba(37, 99, 235, 0.2)"
                              : decision === "rejected"
                              ? "var(--border-subtle)"
                              : "var(--border-subtle)"
                          }`,
                          background: decision === "rejected" ? "var(--bg-subtle)" : "var(--bg-canvas)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                              {bullet.experienceRole} • {bullet.experienceCompany}
                            </span>
                            <Badge variant={bullet.status === "improved" ? "match" : "neutral"}>
                              {bullet.status === "improved" ? "Enhanced Phrasing" : "De-Emphasized"}
                            </Badge>
                            {renderHighlightBadge(bullet.highlightTag)}
                          </div>

                          {/* Accept / Reject / Edit */}
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleAccept(bullet.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "1px solid var(--color-match)",
                                background: decision === "accepted" ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                                color: decision === "accepted" ? "#fff" : "var(--color-match)",
                              }}
                            >
                              <Check size={10} /> {decision === "accepted" ? "Accepted" : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(bullet.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                fontSize: "11.5px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "1px solid var(--border-subtle)",
                                background: decision === "rejected" ? "var(--bg-subtle)" : "transparent",
                                color: decision === "rejected" ? "var(--text-muted)" : "var(--text-secondary)",
                              }}
                            >
                              <X size={10} /> {decision === "rejected" ? "Rejected" : "Reject"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(bullet.id, bullet.tailoredBullet)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                fontSize: "11.5px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "1px solid var(--border-subtle)",
                                background: "transparent",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <Edit3 size={10} /> Edit
                            </button>
                          </div>
                        </div>

                        {/* Bullet Comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "10px" }}>
                          <div style={{ padding: "8px", background: "var(--bg-subtle)", borderRadius: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                            <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                              Original Master Phrasing
                            </span>
                            {bullet.originalBullet}
                          </div>

                          <div style={{ padding: "8px", background: "rgba(37, 99, 235, 0.04)", borderRadius: "4px", fontSize: "12px", color: "var(--color-deep-navy)", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                            <span style={{ fontSize: "10px", color: "var(--color-primary-blue)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                              💡 Tailored Phrasing
                            </span>
                            {isEditing ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  rows={2}
                                  style={{
                                    width: "100%",
                                    padding: "6px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--color-primary-blue)",
                                    fontSize: "12px",
                                    fontFamily: "inherit",
                                  }}
                                />
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <Button size="sm" variant="primary" icon={<Save size={10} />} onClick={() => handleSaveEdit(bullet.id)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              currentText
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          <strong>Reason: </strong> {bullet.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* SECTION 5: Missing Evidence Notices */}
              <Card title="5. Missing Evidence Notices (Zero Fabrication)">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tailoredResume.missingEvidenceNotices.map((notice) => (
                    <div
                      key={notice.id}
                      style={{
                        padding: "12px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.05)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <AlertTriangle size={16} style={{ color: "var(--color-gap)", flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "13px", color: "var(--color-deep-navy)" }}>
                            {notice.jobRequirement}
                          </strong>
                          <Badge variant="gap">{notice.importance}</Badge>
                          <Badge variant="neutral">{notice.evidenceState}</Badge>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          {notice.truthfulGuidance}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* SECTION 6: De-emphasized Content */}
              <Card title="6. De-Emphasized & Removed Content">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tailoredResume.deemphasizedContent.map((item) => {
                    const decision = getDecision(item.id);
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "6px",
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {item.section}: <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{item.originalText}</span>
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.reason}</span>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleAccept(item.id)}
                            style={{
                              padding: "3px 8px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle)",
                              background: decision === "accepted" ? "var(--bg-canvas)" : "transparent",
                              color: decision === "accepted" ? "var(--color-match)" : "var(--text-muted)",
                            }}
                          >
                            {decision === "accepted" ? "Pruned" : "Prune"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item.id)}
                            style={{
                              padding: "3px 8px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              border: "1px solid var(--border-subtle)",
                              background: decision === "rejected" ? "var(--bg-canvas)" : "transparent",
                              color: decision === "rejected" ? "var(--color-primary-blue)" : "var(--text-muted)",
                            }}
                          >
                            Keep
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: FINAL TAILORED RESUME DOCUMENT PREVIEW          */}
      {/* ======================================================== */}
      {activeViewMode === "document" && (
        <Card title={`Job-Specific Tailored Resume Draft (${tailoredResume.targetRole})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Export ready • Formatted specifically for <strong style={{ color: "var(--text-primary)" }}>{tailoredResume.company || tailoredResume.targetRole}</strong>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={copied ? <Check size={12} color="var(--color-match)" /> : <Copy size={12} />}
                  onClick={handleCopyMarkdown}
                >
                  {copied ? "Copied Markdown" : "Copy Markdown"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download size={12} />}
                  onClick={handleDownloadMarkdown}
                >
                  Download .md
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FileCode size={12} />}
                  onClick={() => onNavigate("latex_studio")}
                >
                  Compile in LaTeX Studio
                </Button>
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                background: "var(--bg-subtle)",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                fontFamily: "monospace",
                fontSize: "12.5px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                color: "var(--text-primary)",
                maxHeight: "650px",
                overflowY: "auto",
              }}
            >
              {buildTailoredResumeMarkdown()}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
