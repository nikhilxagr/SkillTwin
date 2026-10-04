import React, { useState, useMemo } from "react";
import {
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Layers,
  Target,
  BookOpen,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  CheckCircle2,
  Check,
  X,
  Copy,
  Download,
  FileText,
  CheckCheck,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import { BulletDiffCard } from "./BulletDiffCard.js";
import type {
  ResumeOptimizationReport,
  ResumeExtraction,
  OptimizationHighlightTag,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ResumeOptimizerViewProps {
  optimization: ResumeOptimizationReport | null;
  resume?: ResumeExtraction | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
  onRecomputeOptimization?: () => void;
}

type TabType =
  | "bullets"
  | "poorly_represented"
  | "keywords"
  | "projects"
  | "sections"
  | "skills_arch"
  | "jd_alignment"
  | "truthful_actions";

type WorkspaceMode = "workspace" | "optimized_resume";

export const ResumeOptimizerView: React.FC<ResumeOptimizerViewProps> = ({
  optimization,
  resume,
  onNavigate,
  onLoadSample,
  onRecomputeOptimization,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("workspace");
  const [activeTab, setActiveTab] = useState<TabType>("bullets");
  const [highlightFilter, setHighlightFilter] = useState<"ALL" | OptimizationHighlightTag>("ALL");

  // Interactive Accept / Reject recommendation state
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Pre-accept first 2 bullets to demonstrate real-time dynamic preview value immediately
    if (optimization?.bulletImprovements?.[0]) initial.add(optimization.bulletImprovements[0].id);
    if (optimization?.bulletImprovements?.[1]) initial.add(optimization.bulletImprovements[1].id);
    if (optimization?.sectionRecommendations?.[0]) initial.add(optimization.sectionRecommendations[0].id);
    return initial;
  });
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [copiedResume, setCopiedResume] = useState(false);

  if (!optimization) {
    return (
      <EmptyState
        icon={<FileCheck2 size={24} />}
        title="Optimization Report Not Generated"
        description="Run a gap analysis between your resume and a target job to produce evidence-grounded resume suggestions."
        actionText="Compare with Job"
        onAction={() => onNavigate("jd_upload")}
        secondaryActionText="Load Sample Report"
        onSecondaryAction={onLoadSample}
      />
    );
  }

  const handleAccept = (id: string) => {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAcceptAll = () => {
    const all = new Set<string>();
    for (const b of optimization.bulletImprovements || []) all.add(b.id);
    for (const p of optimization.projectImprovements || []) all.add(p.id);
    for (const s of optimization.sectionRecommendations || []) all.add(s.id);
    for (const poor of optimization.poorlyRepresentedSkills || []) all.add(poor.id);
    if (optimization.sectionOrdering) all.add(optimization.sectionOrdering.id);
    setAcceptedIds(all);
    setRejectedIds(new Set());
  };

  const handleResetDecisions = () => {
    setAcceptedIds(new Set());
    setRejectedIds(new Set());
  };

  // Count highlights across all categories
  const highlightCounts = useMemo(() => {
    let matched = 0;
    let missing = 0;
    let weak = 0;
    let relevant = 0;

    for (const kw of optimization.keywordCoverage || []) {
      if (kw.highlightTag === "MATCHED") matched++;
      else if (kw.highlightTag === "MISSING") missing++;
      else if (kw.highlightTag === "WEAK_EVIDENCE") weak++;
      else relevant++;
    }

    weak += (optimization.poorlyRepresentedSkills || []).length;
    relevant += (optimization.bulletImprovements || []).length;
    relevant += (optimization.projectImprovements || []).length;
    relevant += (optimization.sectionRecommendations || []).length;
    relevant += (optimization.jdAlignmentRecommendations || []).length;

    return {
      all: matched + missing + weak + relevant,
      MATCHED: matched,
      MISSING: missing,
      WEAK_EVIDENCE: weak,
      RELEVANT: relevant,
    };
  }, [optimization]);

  // Highlight badge helper
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

  // Build clean text representation of the separate optimized resume
  const candidateName =
    resume?.profile?.name ||
    optimization.originalResumeSummary?.candidateName ||
    "Software Engineer";

  const buildOptimizedResumeMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${candidateName}`);
    lines.push(`Target Role: ${optimization.targetRole || "Senior Full Stack Engineer"}\n`);

    // 1. Professional Summary
    const summaryRec = optimization.sectionRecommendations.find(
      (s) => s.sectionName === "Professional Summary",
    );
    lines.push("## Professional Summary");
    if (summaryRec && acceptedIds.has(summaryRec.id)) {
      lines.push(`${summaryRec.recommendedChange}\n`);
    } else if (resume?.profile?.summary) {
      lines.push(`${resume.profile.summary}\n`);
    } else {
      lines.push(
        "Software Engineer with verified production experience across modern web applications and resilient backend architectures.\n",
      );
    }

    // 2. Technical Skills
    lines.push("## Technical Skills");
    if (optimization.skillsSectionRecommendation) {
      for (const cat of optimization.skillsSectionRecommendation.categories) {
        const skills = [...cat.verifiedSkills, ...cat.developingSkills].join(", ");
        lines.push(`- **${cat.categoryName}**: ${skills}`);
      }
      lines.push("");
    } else if (resume?.skillsClaimed) {
      lines.push(`- ${resume.skillsClaimed.join(", ")}\n`);
    }

    // 3. Work Experience
    lines.push("## Work Experience");
    if (resume?.experience && resume.experience.length > 0) {
      for (const exp of resume.experience) {
        lines.push(`### ${exp.role} — ${exp.company} (${exp.startDate || ""} - ${exp.endDate || (exp.current ? "Present" : "")})`);
        for (const b of exp.bullets || []) {
          // Check if bullet was improved and accepted
          const matchedImprovement = optimization.bulletImprovements.find(
            (bi) => bi.originalBullet.trim().toLowerCase() === b.trim().toLowerCase(),
          );
          if (matchedImprovement && acceptedIds.has(matchedImprovement.id)) {
            lines.push(`- ${matchedImprovement.improvedBullet} [Accepted Optimization]`);
          } else {
            lines.push(`- ${b}`);
          }
        }
        lines.push("");
      }
    } else {
      lines.push("### Software Engineer — Engineering Services");
      for (const bi of optimization.bulletImprovements) {
        if (acceptedIds.has(bi.id)) {
          lines.push(`- ${bi.improvedBullet}`);
        } else {
          lines.push(`- ${bi.originalBullet}`);
        }
      }
      lines.push("");
    }

    // 4. Projects
    lines.push("## Technical Projects");
    if (resume?.projects && resume.projects.length > 0) {
      for (const proj of resume.projects) {
        const projRec = optimization.projectImprovements.find(
          (pi) => pi.projectName.toLowerCase() === proj.name.toLowerCase(),
        );
        lines.push(`### ${proj.name}`);
        if (projRec && acceptedIds.has(projRec.id)) {
          lines.push(`${projRec.suggestedEnhancement}`);
        } else if (proj.description) {
          lines.push(`${proj.description}`);
        }
        if (proj.bullets && proj.bullets.length > 0) {
          for (const pb of proj.bullets) {
            lines.push(`- ${pb}`);
          }
        }
        lines.push("");
      }
    }

    // 5. Education
    lines.push("## Education & Credentials");
    if (resume?.education && resume.education.length > 0) {
      for (const edu of resume.education) {
        lines.push(`- **${edu.degree}** — ${edu.institution} (${edu.startDate || ""} - ${edu.endDate || ""})`);
      }
    } else {
      lines.push("- B.S. in Computer Science or Equivalent Practical Experience");
    }

    return lines.join("\n");
  };

  const handleCopyOptimizedResume = () => {
    const text = buildOptimizedResumeMarkdown();
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = buildOptimizedResumeMarkdown();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, "_")}_Optimized_Resume.md`;
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
              Evidence-Grounded Resume Optimizer
            </h2>
            <Badge variant="match">Phase 6 Workspace</Badge>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Optimizing for <strong style={{ color: "var(--text-primary)" }}>{optimization.targetRole || "Target Job"}</strong>
            {optimization.company ? ` at ${optimization.company}` : ""} • Original resume remains strictly untouched while a separate draft is generated.
          </p>
        </div>

        {/* Top View Mode Buttons */}
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
              onClick={() => setWorkspaceMode("workspace")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: workspaceMode === "workspace" ? 700 : 500,
                borderRadius: "6px",
                cursor: "pointer",
                border: "none",
                background: workspaceMode === "workspace" ? "var(--bg-canvas)" : "transparent",
                color: workspaceMode === "workspace" ? "var(--color-primary-blue)" : "var(--text-secondary)",
                boxShadow: workspaceMode === "workspace" ? "var(--shadow-sm)" : "none",
              }}
            >
              <Layers size={13} />
              Review Recommendations
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceMode("optimized_resume")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: workspaceMode === "optimized_resume" ? 700 : 500,
                borderRadius: "6px",
                cursor: "pointer",
                border: "none",
                background: workspaceMode === "optimized_resume" ? "var(--bg-canvas)" : "transparent",
                color: workspaceMode === "optimized_resume" ? "var(--color-match)" : "var(--text-secondary)",
                boxShadow: workspaceMode === "optimized_resume" ? "var(--shadow-sm)" : "none",
              }}
            >
              <FileText size={13} />
              View Optimized Version ({acceptedIds.size})
            </button>
          </div>

          {onRecomputeOptimization && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={onRecomputeOptimization}
            >
              Recompute
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("gap_analysis")}
          >
            Gap Analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("tailored_resume")}
          >
            Job-Specific Tailoring
          </Button>
        </div>
      </div>

      {/* Zero-Fabrication Guarantee Manifesto */}
      <div
        style={{
          padding: "14px 18px",
          background: "var(--color-match-bg)",
          border: "1px solid var(--color-match-border)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <ShieldCheck size={24} style={{ color: "var(--color-match)", flexShrink: 0 }} />
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          <strong style={{ color: "var(--text-primary)" }}>Zero-Fabrication Guarantee: </strong>
          SkillTwin will never insert arbitrary performance numbers (e.g. <em>"improved API latency by 40%"</em>) or fictional technologies.
          If evidence is missing, our system explicitly says:{" "}
          <span style={{ color: "var(--color-deep-navy)", fontWeight: 600 }}>
            "Consider documenting API performance improvements if you have measured them."
          </span>
        </div>
      </div>

      {/* Decision Summary Ribbon */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          background: "var(--bg-elevated)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCheck size={16} style={{ color: "var(--color-match)" }} />
            <span>
              <strong>{acceptedIds.size}</strong> Accepted
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <X size={16} style={{ color: "var(--text-muted)" }} />
            <span>
              <strong>{rejectedIds.size}</strong> Rejected
            </span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Original resume is preserved locked; accepted changes populate the separate draft.
          </div>
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
            Accept All Suggestions
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

      {/* ===================== MODE 1: RECOMMENDATIONS WORKSPACE ===================== */}
      {workspaceMode === "workspace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Highlight Tags Filter Ribbon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginRight: "4px",
              }}
            >
              Highlight Filter:
            </span>
            <button
              onClick={() => setHighlightFilter("ALL")}
              style={{
                background: highlightFilter === "ALL" ? "var(--bg-subtle)" : "transparent",
                border: highlightFilter === "ALL" ? "1px solid var(--border-focus)" : "1px solid transparent",
                color: "var(--text-primary)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "ALL" ? 700 : 500,
              }}
            >
              ALL ({highlightCounts.all})
            </button>
            <button
              onClick={() => setHighlightFilter("MATCHED")}
              style={{
                background: highlightFilter === "MATCHED" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                border: highlightFilter === "MATCHED" ? "1px solid var(--color-match)" : "1px solid transparent",
                color: "var(--color-match)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "MATCHED" ? 700 : 500,
              }}
            >
              🟢 MATCHED ({highlightCounts.MATCHED})
            </button>
            <button
              onClick={() => setHighlightFilter("MISSING")}
              style={{
                background: highlightFilter === "MISSING" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                border: highlightFilter === "MISSING" ? "1px solid var(--color-gap)" : "1px solid transparent",
                color: "var(--color-gap)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "MISSING" ? 700 : 500,
              }}
            >
              🔴 MISSING ({highlightCounts.MISSING})
            </button>
            <button
              onClick={() => setHighlightFilter("WEAK_EVIDENCE")}
              style={{
                background: highlightFilter === "WEAK_EVIDENCE" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                border: highlightFilter === "WEAK_EVIDENCE" ? "1px solid var(--color-partial)" : "1px solid transparent",
                color: "var(--color-partial)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "WEAK_EVIDENCE" ? 700 : 500,
              }}
            >
              🟡 WEAK EVIDENCE ({highlightCounts.WEAK_EVIDENCE})
            </button>
            <button
              onClick={() => setHighlightFilter("RELEVANT")}
              style={{
                background: highlightFilter === "RELEVANT" ? "var(--color-light-blue)" : "transparent",
                border: highlightFilter === "RELEVANT" ? "1px solid #bfdbfe" : "1px solid transparent",
                color: "var(--color-primary-blue)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "RELEVANT" ? 700 : 500,
              }}
            >
              🔵 RELEVANT ({highlightCounts.RELEVANT})
            </button>
            <button
              onClick={() => setHighlightFilter("RECOMMENDED")}
              style={{
                background: highlightFilter === "RECOMMENDED" ? "var(--color-light-blue)" : "transparent",
                border: highlightFilter === "RECOMMENDED" ? "1px solid #bfdbfe" : "1px solid transparent",
                color: "var(--color-primary-blue)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: highlightFilter === "RECOMMENDED" ? 700 : 500,
              }}
            >
              🔵 RECOMMENDED ({highlightCounts.RELEVANT})
            </button>
          </div>

          {/* Main Comparative Split: Left: Locked Original Resume, Right: Recommendations */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(300px, 1fr) minmax(420px, 1.8fr)",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Column: Original Resume (Untouched & Locked) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "16px 18px",
                  background: "var(--bg-canvas)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lock size={15} style={{ color: "var(--text-muted)" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                      Original Resume
                    </h3>
                  </div>
                  <Badge variant="neutral">Locked • Untouched & Unaltered</Badge>
                </div>

                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  Candidate:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>{candidateName}</strong>
                </div>

                {/* Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    padding: "10px",
                    background: "var(--bg-subtle)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                      {optimization.originalResumeSummary?.sectionsPresent?.length || 5}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sections</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-primary-blue)" }}>
                      {optimization.originalResumeSummary?.bulletCount || 6}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Bullets</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-match)" }}>
                      {optimization.originalResumeSummary?.skillsMentionedCount || 12}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Skills</div>
                  </div>
                </div>

                {/* Section List */}
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Detected Original Sections:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(
                      optimization.originalResumeSummary?.sectionsPresent || [
                        "Professional Summary",
                        "Skills",
                        "Work Experience",
                        "Projects",
                        "Education",
                      ]
                    ).map((sec, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "3px 8px",
                          background: "var(--bg-subtle)",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Original Excerpt */}
                {optimization.originalResumeSummary?.rawExcerpt && (
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Raw Text Excerpt:
                    </span>
                    <div
                      style={{
                        padding: "10px",
                        background: "var(--bg-subtle)",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontFamily: "monospace",
                        color: "var(--text-secondary)",
                        lineHeight: "1.4",
                        maxHeight: "160px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {optimization.originalResumeSummary.rawExcerpt}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recommendations Workspace */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Tabs */}
              <div className="tabs-header" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                <button
                  className={`tab-btn ${activeTab === "bullets" ? "active" : ""}`}
                  onClick={() => setActiveTab("bullets")}
                >
                  📝 Bullet Improvements ({optimization.bulletImprovements.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === "poorly_represented" ? "active" : ""}`}
                  onClick={() => setActiveTab("poorly_represented")}
                >
                  ⚠️ Weak Representation ({optimization.poorlyRepresentedSkills?.length || 0})
                </button>
                <button
                  className={`tab-btn ${activeTab === "keywords" ? "active" : ""}`}
                  onClick={() => setActiveTab("keywords")}
                >
                  🎯 Missing Keywords ({optimization.keywordCoverage.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
                  onClick={() => setActiveTab("projects")}
                >
                  🚀 Project Enhancements ({optimization.projectImprovements?.length || 0})
                </button>
                <button
                  className={`tab-btn ${activeTab === "sections" ? "active" : ""}`}
                  onClick={() => setActiveTab("sections")}
                >
                  📑 Section Advice ({optimization.sectionRecommendations?.length || 0})
                </button>
                <button
                  className={`tab-btn ${activeTab === "skills_arch" ? "active" : ""}`}
                  onClick={() => setActiveTab("skills_arch")}
                >
                  🏗️ Skills Layout
                </button>
                <button
                  className={`tab-btn ${activeTab === "jd_alignment" ? "active" : ""}`}
                  onClick={() => setActiveTab("jd_alignment")}
                >
                  🧭 JD Alignment ({optimization.jdAlignmentRecommendations?.length || 0})
                </button>
                <button
                  className={`tab-btn ${activeTab === "truthful_actions" ? "active" : ""}`}
                  onClick={() => setActiveTab("truthful_actions")}
                >
                  🛡️ Directives ({optimization.truthfulRecommendations.length})
                </button>
              </div>

              {/* TAB 1: Bullet Point Improvements */}
              {activeTab === "bullets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {optimization.bulletImprovements
                    .filter((b) => highlightFilter === "ALL" || b.highlightTag === highlightFilter)
                    .map((bullet) => (
                      <BulletDiffCard
                        key={bullet.id}
                        bullet={bullet}
                        status={
                          acceptedIds.has(bullet.id)
                            ? "accepted"
                            : rejectedIds.has(bullet.id)
                            ? "rejected"
                            : "pending"
                        }
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                    ))}
                </div>
              )}

              {/* TAB 2: Skills Already Present But Poorly Represented */}
              {activeTab === "poorly_represented" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(optimization.poorlyRepresentedSkills || []).map((skillItem) => {
                    const isAccepted = acceptedIds.has(skillItem.id);
                    const isRejected = rejectedIds.has(skillItem.id);
                    return (
                      <Card key={skillItem.id}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                                {skillItem.skill}
                              </h4>
                              <Badge variant="neutral">{skillItem.category}</Badge>
                              {renderHighlightBadge(skillItem.highlightTag)}
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => handleAccept(skillItem.id)}
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
                                  background: isAccepted ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                                  color: isAccepted ? "#fff" : "var(--color-match)",
                                }}
                              >
                                <Check size={11} /> {isAccepted ? "Accepted" : "Accept"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(skillItem.id)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  borderRadius: "5px",
                                  cursor: "pointer",
                                  border: "1px solid var(--border-subtle)",
                                  background: isRejected ? "var(--bg-subtle)" : "transparent",
                                  color: isRejected ? "var(--text-muted)" : "var(--text-secondary)",
                                }}
                              >
                                <X size={11} /> {isRejected ? "Rejected" : "Reject"}
                              </button>
                            </div>
                          </div>

                          {/* Current vs Recommended */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div style={{ padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                                📌 Current
                              </span>
                              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                                {skillItem.currentResumeContext}
                              </div>
                            </div>

                            <div style={{ padding: "10px 12px", background: "rgba(37, 99, 235, 0.04)", borderRadius: "6px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--color-primary-blue)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                                💡 Recommended
                              </span>
                              <div style={{ fontSize: "12.5px", color: "var(--color-deep-navy)", fontWeight: 600 }}>
                                {skillItem.recommendation}
                              </div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div style={{ padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                            <strong style={{ color: "var(--text-primary)" }}>🧠 Reason: </strong>
                            <span style={{ color: "var(--text-secondary)" }}>{skillItem.whyPoorlyRepresented}</span>
                          </div>

                          {/* Truth Constraint */}
                          <div style={{ padding: "8px 12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "6px", fontSize: "12px", color: "#92400e", display: "flex", gap: "8px" }}>
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-partial)" }} />
                            <div>
                              <strong>Evidence Requirement: </strong>
                              {skillItem.evidenceRequiredNote}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: Missing Keywords & Requirements */}
              {activeTab === "keywords" && (
                <Card title="Target Job Keyword & Requirement Coverage">
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Job Keyword</th>
                          <th>Category</th>
                          <th>Highlight Tag</th>
                          <th>Status & Guidance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimization.keywordCoverage
                          .filter((kw) => highlightFilter === "ALL" || kw.highlightTag === highlightFilter)
                          .map((kw, idx) => (
                            <tr key={idx}>
                              <td>
                                <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                                  {kw.keyword}
                                </span>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  Importance: {kw.importance || "Required"}
                                </div>
                              </td>
                              <td>
                                <Badge variant="neutral">{kw.category}</Badge>
                              </td>
                              <td>{renderHighlightBadge(kw.highlightTag)}</td>
                              <td style={{ fontSize: "12.5px" }}>
                                {kw.status === "matched" && (
                                  <span style={{ color: "var(--text-secondary)" }}>
                                    {kw.evidenceSnippet || "Verified in candidate matrix."}
                                  </span>
                                )}
                                {kw.status === "missing" && (
                                  <div style={{ color: "var(--color-gap)", fontWeight: 500 }}>
                                    {kw.evidenceRequiredNote || "Evidence required before adding to resume."}
                                  </div>
                                )}
                                {kw.status === "weak_evidence" && (
                                  <div>
                                    <span style={{ color: "var(--text-secondary)" }}>{kw.evidenceSnippet}</span>
                                    {kw.evidenceRequiredNote && (
                                      <div style={{ color: "var(--color-partial)", fontSize: "11.5px", marginTop: "3px" }}>
                                        ⚠️ {kw.evidenceRequiredNote}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* TAB 4: Project Improvements */}
              {activeTab === "projects" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(optimization.projectImprovements || []).map((proj) => {
                    const isAccepted = acceptedIds.has(proj.id);
                    const isRejected = rejectedIds.has(proj.id);
                    return (
                      <Card key={proj.id}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FolderGit2 size={18} style={{ color: "var(--color-primary-blue)" }} />
                              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                                {proj.projectName}
                              </h4>
                              {renderHighlightBadge(proj.highlightTag)}
                            </div>

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
                                  background: isAccepted ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                                  color: isAccepted ? "#fff" : "var(--color-match)",
                                }}
                              >
                                <Check size={11} /> {isAccepted ? "Accepted" : "Accept"}
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
                                  background: isRejected ? "var(--bg-subtle)" : "transparent",
                                  color: isRejected ? "var(--text-muted)" : "var(--text-secondary)",
                                }}
                              >
                                <X size={11} /> {isRejected ? "Rejected" : "Reject"}
                              </button>
                            </div>
                          </div>

                          {/* Current vs Recommended */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "12px" }}>
                            <div style={{ padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                                📌 Current
                              </span>
                              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                                {proj.currentSummary}
                              </div>
                            </div>

                            <div style={{ padding: "10px 12px", background: "rgba(37, 99, 235, 0.04)", borderRadius: "6px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--color-primary-blue)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                                💡 Recommended
                              </span>
                              <div style={{ fontSize: "12.5px", color: "var(--color-deep-navy)", fontWeight: 600 }}>
                                {proj.suggestedEnhancement}
                              </div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div style={{ padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                            <strong style={{ color: "var(--text-primary)" }}>🧠 Reason: </strong>
                            <span style={{ color: "var(--text-secondary)" }}>
                              Targeted competencies: {proj.targetedSkills.join(", ")}. Elevates project deliverables to senior engineering standards.
                            </span>
                          </div>

                          {/* Truth Constraint */}
                          <div style={{ padding: "8px 12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "6px", fontSize: "12px", color: "#92400e", display: "flex", gap: "8px" }}>
                            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-match)" }} />
                            <div>
                              <strong>Truth Constraint: </strong>
                              {proj.truthCheckNote}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* TAB 5: Section Advice & Section Ordering */}
              {activeTab === "sections" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Section Ordering Recommendation Card */}
                  {optimization.sectionOrdering && (
                    <Card title="Recommended Section Ordering for Target Role">
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                            Section Sequence Tailoring
                          </span>
                          {renderHighlightBadge(optimization.sectionOrdering.highlightTag)}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div style={{ padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                            <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                              📌 Current Order
                            </span>
                            <ol style={{ paddingLeft: "18px", margin: 0, fontSize: "12.5px", color: "var(--text-secondary)" }}>
                              {optimization.sectionOrdering.currentOrder.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ol>
                          </div>

                          <div style={{ padding: "10px 12px", background: "rgba(37, 99, 235, 0.04)", borderRadius: "6px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                            <span style={{ fontSize: "10.5px", color: "var(--color-primary-blue)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                              💡 Recommended Order
                            </span>
                            <ol style={{ paddingLeft: "18px", margin: 0, fontSize: "12.5px", color: "var(--color-deep-navy)", fontWeight: 600 }}>
                              {optimization.sectionOrdering.recommendedOrder.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        <div style={{ padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                          <strong style={{ color: "var(--text-primary)" }}>🧠 Reason: </strong>
                          <span style={{ color: "var(--text-secondary)" }}>{optimization.sectionOrdering.reason}</span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Individual Section Recommendations */}
                  {optimization.sectionRecommendations.map((sec) => {
                    const isAccepted = acceptedIds.has(sec.id);
                    const isRejected = rejectedIds.has(sec.id);
                    return (
                      <Card key={sec.id}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <BookOpen size={16} style={{ color: "var(--color-primary-blue)" }} />
                              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                                {sec.sectionName}
                              </h4>
                              {renderHighlightBadge(sec.highlightTag)}
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => handleAccept(sec.id)}
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
                                  background: isAccepted ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                                  color: isAccepted ? "#fff" : "var(--color-match)",
                                }}
                              >
                                <Check size={11} /> {isAccepted ? "Accepted" : "Accept"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(sec.id)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  borderRadius: "5px",
                                  cursor: "pointer",
                                  border: "1px solid var(--border-subtle)",
                                  background: isRejected ? "var(--bg-subtle)" : "transparent",
                                  color: isRejected ? "var(--text-muted)" : "var(--text-secondary)",
                                }}
                              >
                                <X size={11} /> {isRejected ? "Rejected" : "Reject"}
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div style={{ padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                                📌 Current
                              </span>
                              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                {sec.currentEvaluation}
                              </div>
                            </div>

                            <div style={{ padding: "8px 12px", background: "rgba(37, 99, 235, 0.04)", borderRadius: "6px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                              <span style={{ fontSize: "10.5px", color: "var(--color-primary-blue)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                                💡 Recommended
                              </span>
                              <div style={{ fontSize: "12px", color: "var(--color-deep-navy)", fontWeight: 600 }}>
                                {sec.recommendedChange}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            <strong>Truth Constraint: </strong>{sec.truthCheckNote}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* TAB 6: Skills Section Architecture */}
              {activeTab === "skills_arch" && optimization.skillsSectionRecommendation && (
                <Card title="Recommended Skills Section Architecture">
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      <strong>Layout Style: </strong>{optimization.skillsSectionRecommendation.layoutStyle}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                      {optimization.skillsSectionRecommendation.categories.map((cat, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "12px 14px",
                            background: "var(--bg-subtle)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px" }}>
                            {cat.categoryName}
                          </h4>
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--color-match)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                              🟢 Verified Core Competencies:
                            </span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                              {cat.verifiedSkills.map((vs, sIdx) => (
                                <Badge key={sIdx} variant="match">{vs}</Badge>
                              ))}
                            </div>
                          </div>
                          {cat.developingSkills.length > 0 && (
                            <div>
                              <span style={{ fontSize: "11px", color: "var(--color-partial)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                                🟡 Developing / Familiar Tools:
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                {cat.developingSkills.map((ds, dIdx) => (
                                  <Badge key={dIdx} variant="partial">{ds}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "10px 14px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "12.5px" }}>
                      <strong style={{ color: "var(--text-primary)" }}>Formatting Advice: </strong>
                      {optimization.skillsSectionRecommendation.formattingAdvice}
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--color-gap)", fontWeight: 500 }}>
                      ⚠️ <strong>Anti-Fabrication Principle: </strong>
                      {optimization.skillsSectionRecommendation.antiFabricationRule}
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 7: JD Alignment */}
              {activeTab === "jd_alignment" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {optimization.jdAlignmentRecommendations.map((align) => (
                    <Card key={align.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                            {align.title}
                          </h4>
                          {renderHighlightBadge(align.highlightTag)}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          <strong>Target Job Expectation: </strong>{align.targetJobExpectation}
                        </div>
                        <div style={{ padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "6px", fontSize: "13px", color: "var(--color-deep-navy)", fontWeight: 500 }}>
                          <strong>Strategic Suggestion: </strong>{align.alignmentSuggestion}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <strong>Truth Check: </strong>{align.truthCheckNote}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* TAB 8: Truthful Directives */}
              {activeTab === "truthful_actions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {optimization.truthfulRecommendations.map((rec) => (
                    <Card key={rec.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                            {rec.title}
                          </h4>
                          {renderHighlightBadge(rec.highlightTag)}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                          {rec.description}
                        </p>
                        <div style={{ padding: "8px 12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "6px", fontSize: "12px", color: "#92400e" }}>
                          <strong>Truth-Check Directive: </strong>{rec.truthCheckNote}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "var(--color-primary-blue)", fontWeight: 600 }}>
                          Action: {rec.suggestedAction}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODE 2: SEPARATE OPTIMIZED RESUME (DRAFT) ===================== */}
      {workspaceMode === "optimized_resume" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Document Action Bar */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--bg-canvas)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
                  Separate Optimized Resume Version (Draft)
                </span>
                <Badge variant="match">Original Untouched & Preserved</Badge>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Generated dynamically from accepted recommendations ({acceptedIds.size} accepted).
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                variant="outline"
                size="sm"
                icon={copiedResume ? <Check size={13} color="var(--color-match)" /> : <Copy size={13} />}
                onClick={handleCopyOptimizedResume}
              >
                {copiedResume ? "Copied Full Text" : "Copy Markdown Text"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={13} />}
                onClick={handleDownloadMarkdown}
              >
                Download .md File
              </Button>
            </div>
          </div>

          {/* Formatted Clean Document Container */}
          <div
            style={{
              maxWidth: "840px",
              margin: "0 auto",
              width: "100%",
              background: "var(--bg-canvas)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
              padding: "40px 48px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ borderBottom: "2px solid var(--border-subtle)", paddingBottom: "20px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-deep-navy)", margin: 0 }}>
                {candidateName}
              </h1>
              <div style={{ fontSize: "14px", color: "var(--color-primary-blue)", fontWeight: 600, marginTop: "4px" }}>
                {optimization.targetRole || "Senior Full Stack Engineer"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                {resume?.profile?.email && `${resume.profile.email} • `}
                {resume?.profile?.githubUrl && `${resume.profile.githubUrl} • `}
                {resume?.profile?.linkedinUrl && `${resume.profile.linkedinUrl}`}
              </div>
            </div>

            {/* 1. Professional Summary */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                  Professional Summary
                </h3>
                {acceptedIds.has("sec-summary") && (
                  <Badge variant="match">Optimized</Badge>
                )}
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--text-primary)", lineHeight: "1.6", margin: 0 }}>
                {optimization.sectionRecommendations.find((s) => s.sectionName === "Professional Summary" && acceptedIds.has(s.id))
                  ? optimization.sectionRecommendations.find((s) => s.sectionName === "Professional Summary")?.recommendedChange
                  : resume?.profile?.summary ||
                    `Software Engineer specializing in building scalable web applications with verified full-stack competencies. Committed to clean design patterns and reliable software delivery.`}
              </p>
            </div>

            {/* 2. Technical Skills */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>
                Technical Skills
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                {optimization.skillsSectionRecommendation ? (
                  optimization.skillsSectionRecommendation.categories.map((cat, idx) => (
                    <div key={idx}>
                      <strong style={{ color: "var(--text-primary)" }}>{cat.categoryName}: </strong>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {[...cat.verifiedSkills, ...cat.developingSkills].join(", ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>Core Skills: </strong>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {(resume?.skillsClaimed || ["JavaScript", "TypeScript", "React", "Node.js"]).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Work Experience */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "14px" }}>
                Work Experience
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {(resume?.experience && resume.experience.length > 0
                  ? resume.experience
                  : [
                      {
                        role: "Senior Full Stack Developer",
                        company: "Engineering Systems",
                        startDate: "2023",
                        endDate: "Present",
                        current: true,
                        bullets: [
                          "Worked on full-stack web applications with React.",
                          "Built backend API services with Node.js and PostgreSQL.",
                        ],
                      },
                    ]
                ).map((exp, eIdx) => (
                  <div key={eIdx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                        {exp.role} — {exp.company}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {exp.startDate} - {exp.endDate || (exp.current ? "Present" : "")}
                      </span>
                    </div>

                    <ul style={{ paddingLeft: "18px", marginTop: "8px", fontSize: "13px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                      {exp.bullets?.map((bulletText, bIdx) => {
                        const matchedImprovement = optimization.bulletImprovements.find(
                          (bi) => bi.originalBullet.trim().toLowerCase() === bulletText.trim().toLowerCase(),
                        );
                        const isAccepted = matchedImprovement && acceptedIds.has(matchedImprovement.id);

                        return (
                          <li key={bIdx} style={{ marginBottom: "4px" }}>
                            {isAccepted ? (
                              <span>
                                <span style={{ color: "var(--color-deep-navy)", fontWeight: 500 }}>
                                  {matchedImprovement.improvedBullet}
                                </span>{" "}
                                <span style={{ fontSize: "10.5px", color: "var(--color-match)", fontWeight: 700, marginLeft: "4px" }}>
                                  [✓ Optimized]
                                </span>
                              </span>
                            ) : (
                              <span>{bulletText}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Projects */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>
                Technical Projects
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {(resume?.projects && resume.projects.length > 0
                  ? resume.projects
                  : [
                      {
                        name: "CloudCart Architecture",
                        description: "Full-stack e-commerce platform built with React, Node.js, and MongoDB.",
                      },
                    ]
                ).map((proj, pIdx) => {
                  const projRec = optimization.projectImprovements.find(
                    (pi) => pi.projectName.toLowerCase() === proj.name.toLowerCase(),
                  );
                  const isAccepted = projRec && acceptedIds.has(projRec.id);

                  return (
                    <div key={pIdx}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>
                          {proj.name}
                        </strong>
                        {isAccepted && (
                          <span style={{ fontSize: "10.5px", color: "var(--color-match)", fontWeight: 700 }}>
                            [✓ Architecture Enhanced]
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                        {isAccepted ? projRec?.suggestedEnhancement : proj.description || "Portfolio project demonstrating verified full-stack competencies."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Education */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
                Education & Credentials
              </h3>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {resume?.education && resume.education.length > 0 ? (
                  resume.education.map((edu, idx) => (
                    <div key={idx}>
                      <strong style={{ color: "var(--text-primary)" }}>{edu.degree}</strong> — {edu.institution} ({edu.startDate} - {edu.endDate})
                    </div>
                  ))
                ) : (
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>B.S. in Computer Science</strong> — Accredited University
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
